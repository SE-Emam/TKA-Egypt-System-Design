import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";
import { dirname, resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType } from "docx";
import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PROFILE_DIR = resolve(ROOT, "documents/profiles");
export const FORMATS = Object.freeze(["docx", "pdf", "markdown", "html", "pptx"]);
const ajv = new Ajv2020({ allErrors: true, strict: false });
const documentSchema = JSON.parse(readFileSync(resolve(ROOT, "documents/schemas/document.schema.json"), "utf8"));
const profileSchema = JSON.parse(readFileSync(resolve(ROOT, "documents/schemas/project-profile.schema.json"), "utf8"));
const validateDocumentSchema = ajv.compile(documentSchema);
const validateProfileSchema = ajv.compile(profileSchema);

function fail(message) {
  throw new Error("TKA Document System: " + message);
}

export function extractDesignTokens(configSource = readFileSync(resolve(ROOT, "panda.config.ts"), "utf8")) {
  const colorsStart = configSource.indexOf("        colors: {");
  const fontsStart = configSource.indexOf("        fonts: {", colorsStart);
  if (colorsStart < 0 || fontsStart < 0) fail("could not locate canonical color and font tokens in panda.config.ts");
  const colorText = configSource.slice(colorsStart, fontsStart);
  function palette(name) {
    const pattern = new RegExp("^ {10}" + name + ": \\{([\\s\\S]*?)^ {10}\\},?$", "m");
    const found = colorText.match(pattern);
    if (!found) fail("canonical palette " + name + " is missing");
    return found[1];
  }
  function color(name, shade) {
    const match = palette(name).match(new RegExp("^\\s{12}" + shade + ": \\{\\s*value: \"([^\"]+)\"", "m"));
    if (!match || !/^#[0-9a-f]{6}$/i.test(match[1])) fail("canonical color token " + name + "." + shade + " is missing");
    return match[1].toUpperCase();
  }
  const endFontText = configSource.indexOf("        fontSizes:", fontsStart);
  const fontText = configSource.slice(fontsStart, endFontText > -1 ? endFontText : configSource.length);
  const bodyFontLine = fontText.match(/^ {12}value: .+$/m)?.[0];
  const fontName = bodyFontLine?.match(/"([^"]+)"/)?.[1];
  if (!fontName) fail("canonical fonts.body token is missing");
  const colors = {
    brand500: color("brand", "500"),
    accent500: color("accent", "500"),
    neutral0: color("neutral", "0"),
    neutral50: color("neutral", "50"),
    neutral100: color("neutral", "100"),
    neutral200: color("neutral", "200"),
    neutral600: color("neutral", "600"),
    neutral800: color("neutral", "800"),
    neutral900: color("neutral", "900"),
  };
  if (colors.brand500 !== "#0846ED" || colors.accent500 !== "#FEB700") {
    fail("canonical TKA anchors changed: brand.500 must be #0846ED and accent.500 must be #FEB700");
  }
  return { colors, fontName, source: "panda.config.ts" };
}

export function loadProfile(profileId = "tka-default") {
  if (typeof profileId !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profileId)) {
    fail("profile id must be a lowercase slug");
  }
  const file = resolve(PROFILE_DIR, profileId + ".json");
  const relativeProfilePath = relative(PROFILE_DIR, file);
  if (relativeProfilePath.startsWith("..") || isAbsolute(relativeProfilePath) || !existsSync(file)) {
    fail("profile " + profileId + " does not exist; no implicit identity fallback is allowed");
  }
  const profile = JSON.parse(readFileSync(file, "utf8"));
  if (!validateProfileSchema(profile)) fail("profile " + profileId + " does not satisfy project-profile schema: " + ajv.errorsText(validateProfileSchema.errors, { separator: "; " }));
  if (profile.id !== profileId) fail("profile file/id mismatch for " + profileId);
  if (profile.brand?.tokenSource !== "panda.config.ts" || profile.brand?.allowAnchorOverrides !== false) {
    fail("profile " + profileId + " changes or bypasses the canonical token source");
  }
  for (const token of ["brand.500", "accent.500"]) {
    if (!profile.brand?.protectedAnchors?.includes(token)) fail("profile " + profileId + " does not protect " + token);
  }
  if (!Array.isArray(profile.documentDefaults?.formats) || FORMATS.some((format) => !profile.documentDefaults.formats.includes(format))) {
    fail("profile " + profileId + " must allow all five supported formats");
  }
  return profile;
}

const DOC_FIELDS = new Set(["title", "description", "language", "direction", "profile", "sections"]);
const SECTION_FIELDS = new Set(["heading", "paragraphs", "code", "bullets", "table"]);
function onlyKeys(value, keys, label) {
  for (const key of Object.keys(value)) if (!keys.has(key)) fail(label + " has unsupported field " + key);
}
function nonEmptyText(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) fail(label + " must be a non-empty string");
}
function validateSection(section, index) {
  const label = "sections[" + index + "]";
  if (!section || typeof section !== "object" || Array.isArray(section)) fail(label + " must be an object");
  onlyKeys(section, SECTION_FIELDS, label);
  nonEmptyText(section.heading, label + ".heading");
  if (!["paragraphs", "bullets", "code", "table"].some((key) => section[key] !== undefined)) fail(label + " must contain paragraphs, bullets, code, or a table");
  if (section.paragraphs !== undefined && (!Array.isArray(section.paragraphs) || section.paragraphs.some((value) => typeof value !== "string"))) {
    fail(label + ".paragraphs must be an array of strings");
  }
  if (section.code !== undefined && typeof section.code !== "string") fail(label + ".code must be a string");
  if (section.bullets !== undefined && (!Array.isArray(section.bullets) || section.bullets.some((value) => typeof value !== "string"))) {
    fail(label + ".bullets must be an array of strings");
  }
  if (section.table !== undefined) {
    const table = section.table;
    if (!table || typeof table !== "object" || Array.isArray(table)) fail(label + ".table must be an object");
    onlyKeys(table, new Set(["headers", "rows"]), label + ".table");
    if (!Array.isArray(table.headers) || table.headers.length < 1 || table.headers.some((value) => typeof value !== "string")) {
      fail(label + ".table.headers must contain one or more string columns");
    }
    if (!Array.isArray(table.rows) || table.rows.some((row) => !Array.isArray(row) || row.length !== table.headers.length || row.some((value) => typeof value !== "string"))) {
      fail(label + ".table.rows must be string arrays matching the header width");
    }
  }
}

export function validateDocument(document) {
  if (!document || typeof document !== "object" || Array.isArray(document)) fail("document must be a JSON object");
  if (!validateDocumentSchema(document)) fail("document does not satisfy document schema: " + ajv.errorsText(validateDocumentSchema.errors, { separator: "; " }));
  onlyKeys(document, DOC_FIELDS, "document");
  nonEmptyText(document.title, "title");
  nonEmptyText(document.language, "language");
  nonEmptyText(document.profile, "profile");
  if (!["rtl", "ltr"].includes(document.direction)) fail('direction must be "rtl" or "ltr"');
  if (document.description !== undefined && typeof document.description !== "string") fail("description must be a string");
  if (!Array.isArray(document.sections) || document.sections.length < 1) fail("sections must contain at least one section");
  document.sections.forEach(validateSection);
  return document;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeMarkdown(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\|/g, "\\|");
}
function markdownCodeFence(value) {
  const marker = String.fromCharCode(96);
  const matches = String(value).match(new RegExp(marker + "+", "g")) || [];
  let size = 3;
  for (const run of matches) size = Math.max(size, run.length + 1);
  return marker.repeat(size);
}

export function renderMarkdown(document) {
  validateDocument(document);
  const lines = ["# " + escapeMarkdown(document.title), ""];
  if (document.description) lines.push(escapeMarkdown(document.description), "");
  lines.push("> TKA Egypt · " + document.language + " · " + document.direction.toUpperCase(), "");
  for (const section of document.sections) {
    lines.push("## " + escapeMarkdown(section.heading), "");
    for (const paragraph of section.paragraphs || []) lines.push(escapeMarkdown(paragraph), "");
    if (section.bullets?.length) {
      for (const bullet of section.bullets) lines.push("- " + escapeMarkdown(bullet));
      lines.push("");
    }
    if (section.code !== undefined) {
      const fence = markdownCodeFence(section.code);
      lines.push(fence, section.code, fence, "");
    }
    if (section.table) {
      lines.push("| " + section.table.headers.map(escapeMarkdown).join(" | ") + " |");
      lines.push("| " + section.table.headers.map(() => "---").join(" | ") + " |");
      for (const row of section.table.rows) lines.push("| " + row.map(escapeMarkdown).join(" | ") + " |");
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}

function sectionIndex(section, document) { return document.sections.indexOf(section) + 1; }

export function renderHtml(document, tokens = extractDesignTokens()) {
  validateDocument(document);
  const colors = tokens.colors;
  const sections = document.sections.map((section) => {
    const body = [];
    for (const text of section.paragraphs || []) body.push("<p>" + escapeHtml(text) + "</p>");
    if (section.bullets?.length) body.push("<ul>" + section.bullets.map((text) => "<li>" + escapeHtml(text) + "</li>").join("") + "</ul>");
    if (section.code !== undefined) body.push("<pre><code>" + escapeHtml(section.code) + "</code></pre>");
    if (section.table) {
      const header = section.table.headers.map((text) => "<th scope=\"col\">" + escapeHtml(text) + "</th>").join("");
      const rows = section.table.rows.map((row) => "<tr>" + row.map((text) => "<td>" + escapeHtml(text) + "</td>").join("") + "</tr>").join("");
      body.push("<div class=\"table-wrap\"><table><thead><tr>" + header + "</tr></thead><tbody>" + rows + "</tbody></table></div>");
    }
    const id = "section-" + sectionIndex(section, document);
    return "<section aria-labelledby=\"" + id + "\"><h2 id=\"" + id + "\">" + escapeHtml(section.heading) + "</h2>" + body.join("") + "</section>";
  }).join("\n");
  return "<!doctype html>\n<html lang=\"" + escapeHtml(document.language) + "\" dir=\"" + document.direction + "\">\n<head>\n" +
    "<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
    "<meta name=\"generator\" content=\"TKA Document System\">\n<title>" + escapeHtml(document.title) + "</title>\n<style>\n" +
    ":root{color-scheme:light;--tka-brand-blue:" + colors.brand500 + ";--tka-brand-yellow:" + colors.accent500 +
    ";--tka-ink:" + colors.neutral800 + ";--tka-paper:" + colors.neutral0 + ";--tka-muted:" + colors.neutral600 +
    ";--tka-border:" + colors.neutral200 + ";--tka-subtle:" + colors.neutral50 + "}\n" +
    "*{box-sizing:border-box}html{background:var(--tka-paper);color:var(--tka-ink);font-family:\"" + escapeHtml(tokens.fontName) +
    "\",\"Segoe UI\",sans-serif;line-height:1.8}body{margin:0 auto;max-width:54rem;padding:2.5rem clamp(1rem,4vw,3rem)}" +
    "header{border-block-end:4px solid var(--tka-brand-blue);padding-block-end:1rem;margin-block-end:2rem}.wordmark{font-weight:700;color:var(--tka-brand-blue);font-size:.875rem;margin:0 0 .5rem}" +
    "h1,h2{line-height:1.35}h1{font-size:2rem;margin:.2rem 0}h2{font-size:1.35rem;margin-block:2rem .75rem;padding-inline-start:.8rem;border-inline-start:4px solid var(--tka-brand-yellow)}" +
    "p,li{overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--tka-subtle);border-inline-start:3px solid var(--tka-border);padding:1rem;direction:ltr;text-align:left;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.9rem}" +
    "table{border-collapse:collapse;width:100%;margin-block:1rem}th,td{border:1px solid var(--tka-border);padding:.6rem .75rem;text-align:start;vertical-align:top}th{background:var(--tka-subtle);font-weight:700}" +
    "a{color:var(--tka-brand-blue)}.description{color:var(--tka-muted);font-size:1.05rem}.meta{border-block-start:1px solid var(--tka-border);margin-block-start:3rem;padding-block-start:.75rem;color:var(--tka-muted);font-size:.8rem}" +
    "@media(max-width:36rem){body{padding:1.25rem}h1{font-size:1.6rem}.table-wrap{overflow-x:auto}}" +
    "@media print{body{max-width:none;padding:0}section{break-inside:avoid}h2{break-after:avoid}pre,table{break-inside:avoid}a{color:inherit;text-decoration:none}}" +
    "@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}\n</style>\n</head>\n<body>\n" +
    "<header><p class=\"wordmark\">TKA EGYPT</p><h1>" + escapeHtml(document.title) + "</h1>" +
    (document.description ? "<p class=\"description\">" + escapeHtml(document.description) + "</p>" : "") + "</header>\n" +
    "<main>" + sections + "</main>\n<footer class=\"meta\">TKA Egypt · " + escapeHtml(document.language) + " · " + document.direction.toUpperCase() + "</footer>\n</body>\n</html>\n";
}

function directionAlignment(rtl) { return rtl ? AlignmentType.RIGHT : AlignmentType.LEFT; }
function run(text, options = {}) {
  return new TextRun({ text: String(text), font: options.font, size: options.size, bold: options.bold, color: options.color, rightToLeft: options.rtl });
}
function para(text, options = {}) {
  return new Paragraph({
    heading: options.heading,
    bidirectional: options.rtl,
    alignment: directionAlignment(options.rtl),
    spacing: { before: options.heading ? 180 : 0, after: options.heading ? 100 : 140 },
    ...(options.bullet ? { bullet: { level: 0 } } : {}),
    children: [run(text, options)],
  });
}

export async function renderDocx(document, tokens = extractDesignTokens()) {
  validateDocument(document);
  const rtl = document.direction === "rtl";
  const c = tokens.colors;
  const children = [para(document.title, { rtl, font: tokens.fontName, size: 34, color: c.brand500.slice(1), bold: true, heading: HeadingLevel.TITLE })];
  if (document.description) children.push(para(document.description, { rtl, font: tokens.fontName, size: 23, color: c.neutral800.slice(1) }));
  children.push(para("TKA Egypt · " + document.language + " · " + document.direction.toUpperCase(), { rtl, font: tokens.fontName, size: 17, color: c.neutral800.slice(1) }));
  for (const section of document.sections) {
    children.push(para(section.heading, { rtl, font: tokens.fontName, size: 28, color: c.brand500.slice(1), bold: true, heading: HeadingLevel.HEADING_1 }));
    for (const text of section.paragraphs || []) children.push(para(text, { rtl, font: tokens.fontName, color: c.neutral800.slice(1) }));
    for (const text of section.bullets || []) children.push(para(text, { rtl, font: tokens.fontName, color: c.neutral800.slice(1), bullet: true }));
    if (section.code !== undefined) children.push(para(section.code, { rtl: false, font: "Consolas", size: 18, color: c.neutral800.slice(1) }));
    if (section.table) {
      const rows = [section.table.headers, ...section.table.rows].map((values, rowIndex) => new TableRow({
        children: (rtl ? values.slice().reverse() : values).map((value) => new TableCell({
          shading: { type: ShadingType.CLEAR, fill: rowIndex === 0 ? c.brand500.slice(1) : c.neutral50.slice(1) },
          margins: { top: 90, bottom: 90, left: 110, right: 110 },
          children: [new Paragraph({
            bidirectional: rtl,
            alignment: directionAlignment(rtl),
            children: [run(value, { rtl, font: tokens.fontName, size: 18, color: rowIndex === 0 ? "FFFFFF" : c.neutral800.slice(1), bold: rowIndex === 0 })],
          })],
        })),
      }));
      children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: section.table.headers.map(() => Math.floor(9360 / section.table.headers.length)) }));
      children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
    }
  }
  const doc = new Document({
    creator: "TKA Egypt",
    title: document.title,
    subject: document.description || "TKA Egypt governed document",
    description: "Profile: " + document.profile + "; direction: " + document.direction + "; canonical tokens: panda.config.ts",
    styles: { default: { document: { run: { font: tokens.fontName, size: 22, color: c.neutral800.slice(1) } } } },
    sections: [{ properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } }, children }],
  });
  return Packer.toBuffer(doc);
}

export async function renderPdf(document, tokens = extractDesignTokens()) {
  validateDocument(document);
  // LibreOffice applies a mature Arabic shaping and Unicode BiDi pipeline when
  // rendering the same governed DOCX representation. This avoids emitting a
  // technically valid PDF whose mixed RTL/LTR glyph order is visually wrong.
  const workDir = mkdtempSync(join(tmpdir(), "tka-document-pdf-"));
  const docxPath = join(workDir, "document.docx");
  const pdfPath = join(workDir, "document.pdf");
  try {
    const docx = await renderDocx(document, tokens);
    writeFileSync(docxPath, docx);
    const result = spawnSync("soffice", [
      "--headless", "--convert-to", "pdf", "--outdir", workDir, docxPath,
    ], { encoding: "utf8", timeout: 120000 });
    if (result.error?.code === "ENOENT") {
      fail("PDF export requires LibreOffice (soffice) to be installed and available on PATH.");
    }
    if (result.error) fail("LibreOffice PDF export failed to start: " + result.error.message);
    if (result.status !== 0) {
      fail("LibreOffice PDF export exited " + result.status + ": " + (result.stderr || result.stdout || "").slice(-1600));
    }
    if (!existsSync(pdfPath)) fail("LibreOffice completed without producing the expected PDF artifact.");
    const output = readFileSync(pdfPath);
    if (output.subarray(0, 5).toString("ascii") !== "%PDF-") fail("LibreOffice produced an invalid PDF header.");
    return output;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function contentBlocks(section) {
  const blocks = [...(section.paragraphs || []), ...(section.bullets || []).map((item) => "• " + item)];
  if (section.code !== undefined) blocks.push(section.code);
  return blocks;
}
function chunkText(text, limit = 520) {
  const result = [];
  let current = "";
  for (const line of String(text).split("\n")) {
    if (line.length <= limit) {
      if (current && current.length + line.length + 1 <= limit) current += "\n" + line;
      else { if (current) result.push(current); current = line; }
      continue;
    }
    if (current) result.push(current);
    current = "";
    for (const word of line.split(/\s+/)) {
      if (current && current.length + word.length + 1 > limit) { result.push(current); current = word; }
      else current = current ? current + " " + word : word;
    }
    if (current) { result.push(current); current = ""; }
  }
  if (current) result.push(current);
  return result.length ? result : [""];
}

export async function renderPptx(document, tokens = extractDesignTokens()) {
  validateDocument(document);
  const rtl = document.direction === "rtl";
  const c = tokens.colors, font = tokens.fontName;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "TKA Egypt"; pptx.company = "TKA Egypt"; pptx.title = document.title;
  pptx.subject = document.description || "TKA Egypt governed document";
  pptx.lang = document.language; pptx.rtlMode = rtl;
  pptx.theme = { headFontFace: font, bodyFontFace: font, lang: document.language };
  const blue = c.brand500.slice(1), yellow = c.accent500.slice(1), ink = c.neutral800.slice(1), white = c.neutral0.slice(1);
  function contentSlide(title, subtitle = "") {
    const slide = pptx.addSlide();
    slide.background = { color: white };
    slide.addText("TKA EGYPT", { x: 0.55, y: 0.25, w: 3, h: 0.22, fontFace: font, fontSize: 8, bold: true, color: blue, margin: 0 });
    slide.addShape(pptx.ShapeType.line, { x: 0.55, y: 0.57, w: 12.25, h: 0, line: { color: blue, width: 1.5 } });
    slide.addShape(pptx.ShapeType.line, { x: rtl ? 12.05 : 0.55, y: 0.75, w: 0.35, h: 0, line: { color: yellow, width: 3 } });
    if (title) slide.addText(title, { x: 0.65, y: 0.9, w: 12, h: 0.7, fontFace: font, fontSize: 26, bold: true, color: blue, align: rtl ? "right" : "left", valign: "mid", margin: 0.04, rtlMode: rtl, lang: document.language, fit: "shrink" });
    if (subtitle) slide.addText(subtitle, { x: 0.65, y: 1.62, w: 12, h: 0.5, fontFace: font, fontSize: 13, color: ink, align: rtl ? "right" : "left", valign: "top", margin: 0.05, rtlMode: rtl, lang: document.language, fit: "shrink" });
    slide.addText(document.title, { x: 0.65, y: 7.05, w: 11.7, h: 0.2, fontFace: font, fontSize: 7, color: ink, align: rtl ? "right" : "left", margin: 0, rtlMode: rtl });
    return slide;
  }
  const cover = pptx.addSlide();
  cover.background = { color: white };
  cover.addShape(pptx.ShapeType.rect, { x: rtl ? 12.65 : 0, y: 0, w: 0.25, h: 7.5, line: { color: blue, transparency: 100 }, fill: { color: blue } });
  cover.addText("TKA EGYPT", { x: 0.85, y: 1.05, w: 5.5, h: 0.35, fontFace: font, fontSize: 13, bold: true, color: blue, margin: 0 });
  cover.addShape(pptx.ShapeType.line, { x: 0.85, y: 1.55, w: 1.1, h: 0, line: { color: yellow, width: 3.5 } });
  cover.addText(document.title, { x: 0.85, y: 2, w: 11, h: 1.6, fontFace: font, fontSize: 34, bold: true, color: blue, align: rtl ? "right" : "left", valign: "mid", margin: 0.04, rtlMode: rtl, lang: document.language, fit: "shrink" });
  if (document.description) cover.addText(document.description, { x: 0.85, y: 3.7, w: 10.9, h: 1.1, fontFace: font, fontSize: 17, color: ink, align: rtl ? "right" : "left", valign: "top", margin: 0.05, rtlMode: rtl, lang: document.language, fit: "shrink" });
  cover.addText(document.language + " · " + document.direction.toUpperCase() + " · " + document.profile, { x: 0.85, y: 6.55, w: 10.5, h: 0.28, fontFace: font, fontSize: 9, color: ink, align: rtl ? "right" : "left", margin: 0, rtlMode: rtl });
  for (const section of document.sections) {
    const combined = contentBlocks(section).join("\n\n");
    const chunks = combined ? chunkText(combined, 1050) : [];
    if (chunks.length) {
      chunks.forEach((chunk, index) => {
        const slide = contentSlide(section.heading, chunks.length > 1 ? "Part " + (index + 1) + " of " + chunks.length : "");
        slide.addText(chunk, { x: 0.75, y: 2.25, w: 11.85, h: 4.45, fontFace: font, fontSize: 18, color: ink, valign: "top", align: rtl ? "right" : "left", paraSpaceAfterPt: 10, margin: 0.1, rtlMode: rtl, lang: document.language, fit: "shrink" });
      });
    }
    if (section.table) {
      const slide = contentSlide(section.heading, "Data table");
      const tableRows = [section.table.headers, ...section.table.rows].map((row, rowIndex) => row.map((text) => ({
        text,
        options: rowIndex === 0
          ? { bold: true, color: white, fill: { color: blue }, align: rtl ? "right" : "left" }
          : { color: ink, fill: { color: white }, align: rtl ? "right" : "left" },
      })));
      const columnWidth = 11.85 / section.table.headers.length;
      slide.addTable(tableRows, {
        x: 0.75, y: 2.25, w: 11.85, colW: section.table.headers.map(() => columnWidth),
        rowH: 0.52, fontFace: font, fontSize: 13, color: ink,
        border: { type: "solid", pt: 0.6, color: c.neutral200.slice(1) },
        margin: 0.08, autoPage: true, autoPageRepeatHeader: true, rtlMode: rtl,
        valign: "mid",
      });
    } else if (!chunks.length) {
      const slide = contentSlide(section.heading);
      slide.addText("", { x: 0.75, y: 2.25, w: 11.85, h: 4.45, fontFace: font });
    }
  }
  return Buffer.from(await pptx.write({ outputType: "nodebuffer" }));
}

export async function renderDocument(document, format, options = {}) {
  validateDocument(document);
  const profile = loadProfile(options.profileId || document.profile || "tka-default");
  if (document.profile !== profile.id) fail("document profile " + document.profile + " does not match selected profile " + profile.id);
  if (!FORMATS.includes(format)) fail("unsupported format " + format + "; choose " + FORMATS.join(", "));
  if (!profile.documentDefaults.formats.includes(format)) fail("profile " + profile.id + " does not allow " + format);
  const tokens = extractDesignTokens();
  if (format === "markdown") return renderMarkdown(document);
  if (format === "html") return renderHtml(document, tokens);
  if (format === "docx") return renderDocx(document, tokens);
  if (format === "pdf") return renderPdf(document, tokens);
  if (format === "pptx") return renderPptx(document, tokens);
  fail("unsupported format " + format);
}

export async function inspectOfficePackage(buffer, format) {
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: true });
  const needed = format === "docx"
    ? ["[Content_Types].xml", "_rels/.rels", "word/document.xml"]
    : format === "pptx"
      ? ["[Content_Types].xml", "_rels/.rels", "ppt/presentation.xml", "ppt/slides/slide1.xml"]
      : [];
  for (const part of needed) if (!zip.file(part)) fail(format.toUpperCase() + " missing OOXML part " + part);
  if (format === "docx") {
    const xml = await zip.file("word/document.xml").async("string");
    if (!xml.includes("w:document") || !xml.includes("w:body")) fail("DOCX document.xml is invalid");
    return { entries: Object.keys(zip.files).length, documentXml: xml };
  }
  if (format === "pptx") {
    const xml = await zip.file("ppt/presentation.xml").async("string");
    if (!xml.includes("p:presentation")) fail("PPTX presentation.xml is invalid");
    const slidePaths = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
    const slideXmls = await Promise.all(slidePaths.map((name) => zip.file(name).async("string")));
    return { entries: Object.keys(zip.files).length, slides: slidePaths.length, presentationXml: xml, slideXmls };
  }
  return { entries: Object.keys(zip.files).length };
}
