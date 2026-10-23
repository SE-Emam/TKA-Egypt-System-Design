import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const scanner = join(repoRoot, "scripts/check-design-system.mjs");
const required = {
  "AGENTS.md": "# agent rules\n",
  "docs/brand-and-visual-language.md": "# brand\n",
  "docs/anti-ai-slop.md": "# anti slop\n",
  "docs/architecture.md": "# architecture\n",
  "docs/accessibility-and-quality-gates.md": "# quality\n",
  "tests/design-system.test.mjs": "// tests\n",
  "panda.config.ts": `export default { outdir: "styled-system", colors: { brand: { 500: { value: "#0846ED" } }, accent: { 500: { value: "#FEB700" } }, neutral: { 900: { value: "#161C25" } } }, semanticTokens: { colors: { actionPrimary: { value: "{colors.brand.500}" }, onAccent: { value: "{colors.neutral.900}" } } }, recipes: { button: { base: { minH: "44px", _focusVisible: {}, _motionReduce: {} } } } };\n`,
};
function fixture(t, showcaseSource = "<html><body>Real product content</body></html>") {
  const dir = mkdtempSync(join(tmpdir(), "tka-governance-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [path, content] of Object.entries(required)) {
    const target = join(dir, path);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, content);
  }
  mkdirSync(join(dir, "showcase"), { recursive: true });
  writeFileSync(join(dir, "showcase/index.template.html"), showcaseSource);
  mkdirSync(join(dir, "documents/src"), { recursive: true });
  writeFileSync(join(dir, "documents/src/renderers.mjs"), "export const renderer = true;\n");
  return dir;
}
function run(root) {
  return spawnSync(process.execPath, [scanner], {
    cwd: repoRoot,
    env: { ...process.env, TKA_DESIGN_SCAN_ROOT: root },
    encoding: "utf8",
  });
}

test("scanner passes a valid fixture and reports actual source coverage", (t) => {
  const result = run(fixture(t));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scanned 2 production source file\(s\)/);
  assert.match(result.stdout, /showcase\/index\.template\.html/);
});

test("scanner rejects a raw hex literal in the real UI source", (t) => {
  const result = run(fixture(t, "<html><style>.button{color:#123456}</style></html>"));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /raw hex color violation in showcase\/index\.template\.html/);
});

test("scanner rejects gradients and fake placeholder copy", (t) => {
  const result = run(fixture(t, "<html><style>.hero{background:linear-gradient(red,blue)}</style><p>Lorem ipsum</p></html>"));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /gradient violation/);
  assert.match(result.stderr, /fake placeholder copy violation/);
});

test("scanner fails closed when a required scan root is absent", (t) => {
  const root = fixture(t);
  rmSync(join(root, "showcase"), { recursive: true, force: true });
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Required scan root is missing: showcase/);
  assert.match(result.stderr, /canonical showcase template was not included/);
});

test("scanner refuses a vacuous pass when scan roots contain no source files", (t) => {
  const root = fixture(t);
  rmSync(join(root, "showcase/index.template.html"));
  rmSync(join(root, "documents/src/renderers.mjs"));
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /No production UI\/document source files were scanned/);
});

test("canonical renderer may parse hex tokens but is still scanned for decorative violations", (t) => {
  const root = fixture(t);
  writeFileSync(join(root, "documents/src/renderers.mjs"), 'const validToken = /^#[0-9a-f]{6}$/i;\n');
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  writeFileSync(join(root, "documents/src/renderers.mjs"), 'const invalid = "linear-gradient(red, blue)";\n');
  const rejected = run(root);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /gradient violation in documents\/src\/renderers\.mjs/);
});
