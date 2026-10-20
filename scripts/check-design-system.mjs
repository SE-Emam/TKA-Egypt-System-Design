import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const configPath = join(root, "panda.config.ts");
const config = readFileSync(configPath, "utf8");
const requiredFiles = [
  "AGENTS.md",
  "docs/brand-and-visual-language.md",
  "docs/anti-ai-slop.md",
  "docs/architecture.md",
  "docs/accessibility-and-quality-gates.md",
  "tests/design-system.test.mjs",
];

const failures = [];
for (const path of requiredFiles) {
  if (!existsSync(join(root, path))) failures.push(`Missing required design-system file: ${path}`);
}

for (const [label, value] of [
  ["TKA royal blue", "#0846ED"],
  ["TKA yellow", "#FEB700"],
]) {
  if (!config.includes(value)) failures.push(`Missing exact brand anchor for ${label}: ${value}`);
}

if (!config.includes('outdir: "styled-system"')) failures.push("Panda generated output directory is not explicitly configured.");
if (!config.includes('actionPrimary: { value: "{colors.brand.500}" }')) failures.push("Primary actions must reference the canonical brand-blue token.");
if (!config.includes('onAccent: { value: "{colors.neutral.900}" }')) failures.push("Yellow accent must use a dark foreground token.");
if (!config.includes('minH: "44px"')) failures.push("Accessible 44px default target is missing from the shared recipes.");
if (!config.includes("_focusVisible")) failures.push("Visible keyboard focus recipe is missing.");
if (!config.includes("_motionReduce")) failures.push("Reduced-motion handling is missing.");

const targetRoots = ["src/app", "src/components", "src/pages", "src/ui"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html"]);
const banned = [
  ["gradient", /(?:linear|radial|conic)-gradient\s*\(/i],
  ["glass/blur effect", /backdrop-filter\s*:|filter\s*:\s*blur\s*\(/i],
  ["text gradient", /background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text/i],
  ["raw hex color", /#[\da-f]{3,8}\b/i],
  ["fake placeholder copy", /lorem ipsum|your company here|insert testimonial/i],
];

function walk(dir) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(path));
    else if ([...extensions].some((ext) => entry.name.endsWith(ext))) found.push(path);
  }
  return found;
}

for (const relRoot of targetRoots) {
  for (const file of walk(join(root, relRoot))) {
    const source = readFileSync(file, "utf8");
    for (const [label, pattern] of banned) {
      pattern.lastIndex = 0;
      if (pattern.test(source)) failures.push(`${label} violation in ${file.replace(root + "/", "")}`);
    }
  }
}

if (failures.length) {
  console.error("TKA design-system checks FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("TKA design-system static checks passed.");
}
