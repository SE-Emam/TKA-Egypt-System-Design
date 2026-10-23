#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { renderDocument, FORMATS } from "../documents/src/renderers.mjs";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: npm run docs:render -- --input ./document.json --format markdown|html|docx|pdf|pptx --out ./output.ext [--profile tka-default]");
    return;
  }
  const input = argument("--input");
  const format = argument("--format");
  const output = argument("--out");
  const profileId = argument("--profile");
  if (!input || !format || !output) throw new Error("--input, --format, and --out are required");
  if (!FORMATS.includes(format)) throw new Error("Unsupported format " + format + ". Supported: " + FORMATS.join(", "));
  const document = JSON.parse(readFileSync(resolve(input), "utf8"));
  // Keep the content contract authoritative: a selected profile must match the document profile.
  const bytes = await renderDocument(document, format, { profileId: profileId || document.profile });
  const destination = resolve(output);
  const expectedExtension = format === "markdown" ? ".md" : "." + format;
  if (extname(destination).toLowerCase() !== expectedExtension) throw new Error("Output file extension must be " + expectedExtension);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, bytes);
  console.log(JSON.stringify({ status: "GENERATED", format, output: destination, bytes: Buffer.byteLength(bytes), profile: document.profile, language: document.language, direction: document.direction }, null, 2));
}
main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
