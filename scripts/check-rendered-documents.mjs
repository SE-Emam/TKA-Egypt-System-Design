import { existsSync, mkdirSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const artifactDir = resolve(process.argv[2] || ".test-artifacts/documents");
const visualDir = resolve(".test-artifacts/previews");
const conversionDir = resolve(".test-artifacts/office-pdf");
const required = ["acceptance-sample.md", "acceptance-sample.html", "acceptance-sample.docx", "acceptance-sample.pdf", "acceptance-sample.pptx"];
const fail = (message) => { throw new Error("Rendered document acceptance failed: " + message); };
for (const file of required) if (!existsSync(resolve(artifactDir, file))) fail("missing generated file " + file);
for (const [command, versionArgs] of [["soffice", ["--version"]], ["pdfinfo", ["-v"]], ["pdftotext", ["-v"]], ["pdftoppm", ["-v"]]]) {
  const check = spawnSync(command, versionArgs, { encoding: "utf8" });
  if (check.error && check.error.code === "ENOENT") fail("required visual-validation utility is unavailable: " + command);
}
const browserCandidates = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];
const browserCommand = browserCandidates.find((command) => {
  const check = spawnSync(command, ["--version"], { encoding: "utf8" });
  return !check.error && check.status === 0;
});
if (!browserCommand) fail("a Chromium-compatible browser is required to validate actual HTML rendering");
rmSync(visualDir, { recursive: true, force: true });
rmSync(conversionDir, { recursive: true, force: true });
mkdirSync(visualDir, { recursive: true });
mkdirSync(conversionDir, { recursive: true });
function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 120000 });
  if (result.error) fail(command + " execution error: " + result.error.message);
  if (result.status !== 0) fail(command + " exited " + result.status + ": " + (result.stderr || result.stdout || "").slice(-1600));
  return result.stdout || "";
}
function normalize(value) { return value.normalize("NFKC").replace(/\s+/g, " ").trim(); }
const markdown = normalize((await import("node:fs")).readFileSync(resolve(artifactDir, "acceptance-sample.md"), "utf8"));
const html = (await import("node:fs")).readFileSync(resolve(artifactDir, "acceptance-sample.html"), "utf8");
if (!markdown.includes("قبول نظام مستندات TKA") || !markdown.includes("مخرجات المستندات")) fail("Markdown content-preservation check did not find the Arabic fixture text");
if (!html.includes('lang="ar" dir="rtl"') || !html.includes("--tka-brand-blue:#0846ED") || !html.includes("--tka-brand-yellow:#FEB700")) fail("HTML direction/canonical brand-token check failed");
for (const source of ["acceptance-sample.docx", "acceptance-sample.pptx", "acceptance-sample.html"]) {
  const formatDir = resolve(conversionDir, extname(source).slice(1));
  mkdirSync(formatDir, { recursive: true });
  const pdf = resolve(formatDir, basename(source, extname(source)) + ".pdf");
  if (source.endsWith(".html")) {
    run(browserCommand, [
      "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
      "--no-pdf-header-footer", "--print-to-pdf=" + pdf,
      pathToFileURL(resolve(artifactDir, source)).href,
    ]);
    if (!existsSync(pdf)) fail(browserCommand + " did not create a browser-rendered PDF for " + source);
  } else {
    const result = run("soffice", ["--headless", "--convert-to", "pdf", "--outdir", formatDir, resolve(artifactDir, source)]);
    if (!existsSync(pdf)) fail("LibreOffice did not create PDF rendering for " + source + ". " + result);
  }
}
const pdfs = [
  resolve(artifactDir, "acceptance-sample.pdf"),
  ...["acceptance-sample.docx", "acceptance-sample.pptx", "acceptance-sample.html"].map((source) => resolve(conversionDir, extname(source).slice(1), basename(source, extname(source)) + ".pdf")),
];
const report = [];
for (let index = 0; index < pdfs.length; index += 1) {
  const pdf = pdfs[index];
  const sourceId = index === 0 ? "pdf" : ["docx", "pptx", "html"][index - 1];
  const info = run("pdfinfo", [pdf]);
  const pageMatch = info.match(/^Pages:\s+(\d+)/m);
  if (!pageMatch || Number(pageMatch[1]) < 1) fail("PDF page-count check failed for " + pdf);
  const pages = Number(pageMatch[1]);
  if (sourceId === "pptx" && pages > 8) fail("PPTX acceptance fixture produced " + pages + " slides/pages; expected 8 or fewer");
  const textPath = resolve(visualDir, sourceId + "-acceptance-sample.txt");
  run("pdftotext", ["-layout", pdf, textPath]);
  const extracted = normalize((await import("node:fs")).readFileSync(textPath, "utf8"));
  if (!extracted) fail("text extraction is empty for " + pdf);
  if (!extracted.toUpperCase().includes("TKA EGYPT")) fail("document identity was lost during PDF conversion: " + pdf);
  if (!/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u.test(extracted)) fail("Arabic glyph text is missing from the rendered PDF: " + pdf);
  if (!extracted.includes("عينة عربية للتحقق من الهوية")) fail("Arabic content-preservation check failed after rendering: " + pdf);
  const previewBase = resolve(visualDir, sourceId + "-acceptance-sample-page");
  run("pdftoppm", ["-scale-to", "1400", "-png", pdf, previewBase]);
  const previewFiles = readdirSync(visualDir).filter((name) => name.startsWith(sourceId + "-acceptance-sample-page-") && name.endsWith(".png")).sort();
  if (previewFiles.length !== pages) fail("page preview count (" + previewFiles.length + ") does not match PDF page count (" + pages + ") for " + pdf);
  report.push({ file: pdf, pages, extractedTextCharacters: extracted.length, source: sourceId, renderer: sourceId === "html" ? browserCommand : sourceId === "pdf" ? "LibreOffice from DOCX" : "LibreOffice", previewCount: previewFiles.length, previews: previewFiles.map((name) => resolve(visualDir, name)) });
}
if (report.length !== 4 || report.some((item) => item.pages < 1)) fail("not all four PDF sources completed the page-count gate");
writeFileSync(resolve(visualDir, "acceptance-report.json"), JSON.stringify({ status: "PASS", profile: "tka-default", renderCount: report.length, reports: report }, null, 2) + "\n");
console.log(JSON.stringify({ status: "PASS", artifacts: required.length, officeConversions: 2, browserHtmlRender: browserCommand, validatedPdfRenders: report.length, report: resolve(visualDir, "acceptance-report.json") }, null, 2));
