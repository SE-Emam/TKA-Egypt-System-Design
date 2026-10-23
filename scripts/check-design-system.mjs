import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.env.TKA_DESIGN_SCAN_ROOT || process.cwd());
const failures = [];
const configPath = join(root, "panda.config.ts");
const requiredFiles = [
  "AGENTS.md",
  "docs/brand-and-visual-language.md",
  "docs/anti-ai-slop.md",
  "docs/architecture.md",
  "docs/accessibility-and-quality-gates.md",
  "tests/design-system.test.mjs",
  "showcase/index.template.html",
  "panda.config.ts",
];
for (const path of requiredFiles) {
  if (!existsSync(join(root, path))) failures.push(`Missing required design-system file: ${path}`);
}

let config = "";
if (existsSync(configPath)) config = readFileSync(configPath, "utf8");
for (const [label, value] of [
  ["TKA royal blue", "#0846ED"],
  ["TKA yellow", "#FEB700"],
]) {
  if (!config.includes(value)) failures.push(`Missing exact brand anchor for ${label}: ${value}`);
}
if (config && !config.includes('outdir: "styled-system"')) failures.push("Panda generated output directory is not explicitly configured.");
if (config && !config.includes('actionPrimary: { value: "{colors.brand.500}" }')) failures.push("Primary actions must reference the canonical brand-blue token.");
if (config && !config.includes('onAccent: { value: "{colors.neutral.900}" }')) failures.push("Yellow accent must use a dark foreground token.");
if (config && !config.includes('minH: "44px"')) failures.push("Accessible 44px default target is missing from the shared recipes.");
if (config && !config.includes("_focusVisible")) failures.push("Visible keyboard focus recipe is missing.");
if (config && !config.includes("_motionReduce")) failures.push("Reduced-motion handling is missing.");

const scanRoots = ["showcase", "documents/src"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".mjs"]);
const banned = [
  ["gradient", /(?:linear|radial|conic)-gradient\s*\(/i],
  ["glass/blur effect", /backdrop-filter\s*:|filter\s*:\s*blur\s*\(/i],
  ["text gradient", /background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text/i],
  ["raw hex color", /#[\da-f]{3,8}\b/i],
  ["fake placeholder copy", /lorem ipsum|your company here|insert testimonial/i],
  ["fake proof/metrics", /(?:\b|_)\d+(?:\.\d+)?\s*(?:k\+?\s*)?(?:customers|users|clients|testimonials|five-star reviews)\b/i],
];
function walk(dir) {
  if (!existsSync(dir)) {
    failures.push(`Required scan root is missing: ${relative(root, dir)}`);
    return [];
  }
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(path));
    else if ([...extensions].some((ext) => entry.name.endsWith(ext))) found.push(path);
  }
  return found;
}

const scannedFiles = [];
for (const relRoot of scanRoots) scannedFiles.push(...walk(join(root, relRoot)));
if (scannedFiles.length === 0) failures.push("No production UI/document source files were scanned; refusing a vacuous PASS.");
for (const file of scannedFiles) {
  const source = readFileSync(file, "utf8");
  const relPath = relative(root, file);
  for (const [label, pattern] of banned) {
    // The document renderer must parse and validate canonical hex values extracted
    // from panda.config.ts. Its regex and immutable-anchor guards are implementation
    // logic, not UI color declarations. Keep all other anti-slop rules active there.
    if (label === "raw hex color" && relPath === "documents/src/renderers.mjs") continue;
    pattern.lastIndex = 0;
    if (pattern.test(source)) failures.push(`${label} violation in ${relPath}`);
  }
}
if (!scannedFiles.some((file) => file.endsWith("index.template.html"))) failures.push("The canonical showcase template was not included in the scan.");

if (failures.length) {
  console.error("TKA design-system checks FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`Scanned ${scannedFiles.length} production source file(s).`);
  process.exitCode = 1;
} else {
  console.log(`TKA design-system static checks passed; scanned ${scannedFiles.length} production source file(s):`);
  for (const file of scannedFiles) console.log(`- ${relative(root, file)}`);
}
