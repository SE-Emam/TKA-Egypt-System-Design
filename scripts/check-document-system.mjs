import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const requiredFiles = [
  "docs/document-system.md",
  "documents/schemas/document.schema.json",
  "documents/schemas/project-profile.schema.json",
  "documents/profiles/tka-default.json",
  "documents/examples/acceptance-sample.json",
  "documents/src/renderers.mjs",
  "documents/templates/markdown/document.md.tmpl",
  "documents/templates/html/document.html.tmpl",
  "tests/document-system.test.mjs",
  "scripts/render-document.mjs",
  "scripts/generate-document-fixtures.mjs",
  "scripts/check-rendered-documents.mjs",
];
for (const path of requiredFiles) if (!existsSync(join(root, path))) failures.push("Missing required document-system file: " + path);

function parseJson(path) {
  try { return JSON.parse(readFileSync(join(root, path), "utf8")); }
  catch (error) { failures.push("Invalid or unreadable JSON " + path + ": " + error.message); return null; }
}
const config = readFileSync(join(root, "panda.config.ts"), "utf8");
for (const [label, value] of [["TKA royal blue", "#0846ED"], ["TKA yellow", "#FEB700"]]) {
  if (!config.includes(value)) failures.push("Canonical token source is missing " + label + " " + value);
}
const packageJson = parseJson("package.json");
for (const dependency of ["docx", "pdf-lib", "@pdf-lib/fontkit", "bidi-js", "naqqash", "pptxgenjs", "jszip"]) {
  if (!packageJson?.dependencies?.[dependency]) failures.push("Missing runtime dependency for real output validation: " + dependency);
}
for (const script of ["check:documents", "docs:render", "docs:fixtures", "docs:visual-check"]) {
  if (!packageJson?.scripts?.[script]) failures.push("Missing package script: " + script);
}
const profileSchema = parseJson("documents/schemas/project-profile.schema.json");
const documentSchema = parseJson("documents/schemas/document.schema.json");
if (profileSchema?.properties?.brand?.properties?.tokenSource?.const !== "panda.config.ts") failures.push("Profiles must point to panda.config.ts as the canonical token source.");
if (profileSchema?.properties?.brand?.properties?.allowAnchorOverrides?.const !== false) failures.push("Profiles must forbid protected brand-anchor overrides.");
if (documentSchema?.additionalProperties !== false) failures.push("Document content contract must reject unknown top-level properties.");
const example = parseJson("documents/examples/acceptance-sample.json");
if (example?.profile !== "tka-default" || example?.direction !== "rtl" || example?.language !== "ar") failures.push("Acceptance fixture must exercise the explicit default Arabic RTL profile.");
if (!Array.isArray(example?.sections) || !example.sections.some((section) => section.code !== undefined) || !example.sections.some((section) => section.table)) {
  failures.push("Acceptance fixture must include code and a table in real output checks.");
}
const renderer = existsSync(join(root, "documents/src/renderers.mjs"))
  ? readFileSync(join(root, "documents/src/renderers.mjs"), "utf8") : "";
for (const format of ["markdown", "html", "docx", "pdf", "pptx"]) {
  if (!renderer.includes('format === "' + format + '"') && !renderer.includes('case "' + format + '"')) failures.push("No real renderer dispatch found for format " + format);
}
const profilesDir = join(root, "documents/profiles");
if (existsSync(profilesDir)) for (const name of readdirSync(profilesDir).filter((file) => file.endsWith(".json"))) {
  const path = join("documents/profiles", name);
  const profile = parseJson(path);
  if (!profile) continue;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.id ?? "")) failures.push("Invalid profile id in " + path);
  if (profile.brand?.tokenSource !== "panda.config.ts") failures.push("Non-canonical token source in " + path);
  if (profile.brand?.allowAnchorOverrides !== false) failures.push("Protected brand anchors can be overridden in " + path);
  for (const anchor of ["brand.500", "accent.500"]) if (!profile.brand?.protectedAnchors?.includes(anchor)) failures.push("Missing protected anchor " + anchor + " in " + path);
  for (const format of ["docx", "pdf", "markdown", "html", "pptx"]) if (!(profile.documentDefaults?.formats ?? []).includes(format)) failures.push("Profile " + path + " does not declare requested format " + format);
  if (!["rtl", "ltr"].includes(profile.documentDefaults?.direction)) failures.push("Invalid direction in " + path);
}
if (failures.length) {
  console.error("TKA document-system checks FAILED:");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("TKA document-system governance checks passed. Exporter behavior is verified separately by renderer/acceptance tests.");
}
