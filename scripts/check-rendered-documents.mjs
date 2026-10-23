import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, extname, resolve } from "node:path";

const artifactDir = resolve(process.argv[2] || ".test-artifacts/documents");
const visualDir = resolve(".test-artifacts/previews");
const conversionDir = resolve(".test-artifacts/office-pdf");
const required = ["acceptance-sample.md", "acceptance-sample.html", "acceptance-sample.docx", "acceptance-sample.pdf", "acceptance-sample.pptx"];
const fail = (message) => { throw new Error("Rendered document acceptance failed: " + message); };
for (const file of required) if (!existsSync(resolve(artifactDir, file))) fail("missing generated file " + file);
for (const command of ["soffice", "pdfinfo", "pdftotext", "pdftoppm"]) {
  const check = spawnSync(command, ["--version"], { encoding: "utf8" });
  if (check.error && check.error.code === "ENOENT") fail("required visual-validation utility is unavailable: " + command);
}
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
if (!markdown.includes("قبول نظام مستندات TKA") || !markdown.includes("المخرجات الخمس")) fail("Markdown content-preservation check did not find the Arabic fixture text");
if (!html.includes('lang="ar" dir="rtl"') || !html.includes("--tka-brand-blue:#0846ED") || !html.includes("--tka-brand-yellow:#FEB700")) fail("HTML direction/canonical brand-token check failed");
for (const source of ["acceptance-sample.docx", "acceptance-sample.pptx", "acceptance-sample.html"]) {
  const result = run("soffice", ["--headless", "--convert-to", "pdf", "--outdir", conversionDir, resolve(artifactDir, source)]);
  const pdf = resolve(conversionDir, basename(source, extname(source)) + ".pdf");
  if (!existsSync(pdf)) fail("LibreOffice did not create PDF rendering for " + source + ". " + result);
}
const pdfs = [
  resolve(artifactDir, "acceptance-sample.pdf"),
  ...["acceptance-sample.docx", "acceptance-sample.pptx", "acceptance-sample.html"].map((source) => resolve(conversionDir, basename(source, extname(source)) + ".pdf")),
];
const report = [];
for (let index = 0; index < pdfs.length; index += 1) {
  const pdf = pdfs[index];
  const info = run("pdfinfo", [pdf]);
  const pageMatch = info.match(/^Pages:\s+(\d+)/m);
  if (!pageMatch || Number(pageMatch[1]) < 1) fail("PDF page-count check failed for " + pdf);
  const textPath = resolve(visualDir, basename(pdf, ".pdf") + ".txt");
  run("pdftotext", ["-layout", pdf, textPath]);
  const extracted = normalize((await import("node:fs")).readFileSync(textPath, "utf8"));
  if (!extracted) fail("text extraction is empty for " + pdf);
  if (!extracted.toUpperCase().includes("TKA EGYPT")) fail("document identity was lost during PDF conversion: " + pdf);
  const previewBase = resolve(visualDir, basename(pdf, ".pdf") + "-page");
  run("pdftoppm", ["-f", "1", "-l", "1", "-scale-to", "1400", "-png", pdf, previewBase]);
  report.push({ file: pdf, pages: Number(pageMatch[1]), extractedTextCharacters: extracted.length, firstPagePreview: previewBase + "-1.png" });
}
const htmlPageCount = Number(report.find((item) => item.file.endsWith("acceptance-sample.html.pdf"))?.pages || 1);
if (!report.length || htmlPageCount < 1) fail("visual render report is empty");
writeFileSync(resolve(visualDir, "acceptance-report.json"), JSON.stringify({ status: "PASS", profile: "tka-default", renderCount: report.length, reports: report }, null, 2) + "\n");
console.log(JSON.stringify({ status: "PASS", artifacts: required.length, officeAndHtmlConversions: 3, validatedPdfRenders: report.length, report: resolve(visualDir, "acceptance-report.json") }, null, 2));
