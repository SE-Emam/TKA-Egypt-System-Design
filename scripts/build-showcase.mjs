import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, extractDesignTokens } from "../documents/src/renderers.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(resolve(here, "../showcase/index.template.html"), "utf8");
const tokens = extractDesignTokens();
const values = {
  __BRAND_BLUE__: tokens.colors.brand500,
  __BRAND_BLUE_LIGHT__: tokens.colors.brand300,
  __BRAND_YELLOW__: tokens.colors.accent500,
  __NEUTRAL_0__: tokens.colors.neutral0,
  __NEUTRAL_50__: tokens.colors.neutral50,
  __NEUTRAL_100__: tokens.colors.neutral100,
  __NEUTRAL_200__: tokens.colors.neutral200,
  __NEUTRAL_300__: tokens.colors.neutral300,
  __NEUTRAL_600__: tokens.colors.neutral600,
  __NEUTRAL_700__: tokens.colors.neutral700,
  __NEUTRAL_800__: tokens.colors.neutral800,
  __NEUTRAL_900__: tokens.colors.neutral900,
  __NEUTRAL_950__: tokens.colors.neutral950,
  __GREEN_50__: tokens.colors.green50,
  __GREEN_700__: tokens.colors.green700,
  __GREEN_900__: tokens.colors.green900,
  __AMBER_50__: tokens.colors.amber50,
  __AMBER_800__: tokens.colors.amber800,
  __AMBER_950__: tokens.colors.amber950,
  __RED_50__: tokens.colors.red50,
  __RED_700__: tokens.colors.red700,
  __RED_900__: tokens.colors.red900,
  __FONT_NAME__: tokens.fontName,
};
let html = template;
for (const [key, value] of Object.entries(values)) html = html.split(key).join(value);
const unresolved = html.match(/__[A-Z0-9_]+__/g);
if (unresolved) throw new Error("Unresolved showcase token placeholders: " + [...new Set(unresolved)].join(", "));
if (!html.includes('style="background:var(--brand-blue)"') || !html.includes('data-theme=dark')) throw new Error("Showcase is missing canonical color usage or theme controls.");
const outputDir = resolve(ROOT, "site");
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "index.html"), html);
console.log(JSON.stringify({ status: "BUILT", output: resolve(outputDir, "index.html"), tokenSource: "panda.config.ts", tokenCount: Object.keys(values).length }, null, 2));
