import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FORMATS, renderDocument, ROOT } from "../documents/src/renderers.mjs";

const samplePath = resolve(ROOT, "documents/examples/acceptance-sample.json");
const sample = (await import("node:fs", { with: { type: "json" } }).catch(() => null));
const document = JSON.parse((await import("node:fs")).readFileSync(samplePath, "utf8"));
function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
const outputDir = resolve(arg("--out", ".test-artifacts/documents"));
mkdirSync(outputDir, { recursive: true });
const report = [];
for (const format of FORMATS) {
  const output = await renderDocument(document, format, { fontPath: process.env.TKA_DOCUMENT_FONT });
  const extension = format === "markdown" ? "md" : format;
  const file = resolve(outputDir, "acceptance-sample." + extension);
  writeFileSync(file, output);
  report.push({ format, file, bytes: Buffer.byteLength(output) });
}
console.log(JSON.stringify({ status: "GENERATED", profile: document.profile, outputDir, artifacts: report }, null, 2));
