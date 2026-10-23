import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const config = readFileSync(new URL("../panda.config.ts", import.meta.url), "utf8");
const brandDocs = readFileSync(new URL("../docs/brand-and-visual-language.md", import.meta.url), "utf8");
const antiSlop = readFileSync(new URL("../docs/anti-ai-slop.md", import.meta.url), "utf8");
const architecture = readFileSync(new URL("../docs/architecture.md", import.meta.url), "utf8");

function luminance(hex) {
  const channels = hex.replace("#", "").match(/.{2}/g).map((v) => parseInt(v, 16) / 255);
  const linear = channels.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("brand anchors are exact and documented", () => {
  assert.match(config, /500:\s*\{ value: "#0846ED"/);
  assert.match(config, /500:\s*\{ value: "#FEB700"/);
  assert.match(brandDocs, /#0846ED/);
  assert.match(brandDocs, /#FEB700/);
});

test("approved primary-action foreground meets WCAG AA normal-text contrast", () => {
  assert.ok(contrast("#0846ED", "#FFFFFF") >= 4.5, "white on TKA blue must be at least 4.5:1");
});

test("approved yellow foreground is dark and meets WCAG AA", () => {
  assert.ok(contrast("#FEB700", "#161C25") >= 4.5, "dark neutral on TKA yellow must be at least 4.5:1");
  assert.ok(contrast("#FEB700", "#FFFFFF") < 4.5, "white text must not be approved on TKA yellow");
});

test("semantic roles reference canonical palette tokens", () => {
  assert.match(config, /actionPrimary:\s*\{ value: "\{colors\.brand\.500\}" \}/);
  assert.match(config, /onAccent:\s*\{ value: "\{colors\.neutral\.900\}" \}/);
});

test("shared interaction recipes provide focus, disabled, touch-target and reduced-motion states", () => {
  assert.match(config, /minH: "44px"/);
  assert.match(config, /_focusVisible/);
  assert.match(config, /_disabled/);
  assert.match(config, /_motionReduce/);
});

test("anti-slop standard explicitly rejects generic decorative patterns", () => {
  for (const phrase of ["glassmorphism", "decorative blobs", "fake KPI numbers", "emoji", "raw color literals"]) {
    assert.ok(antiSlop.toLowerCase().includes(phrase.toLowerCase()), `anti-slop standard must mention: ${phrase}`);
  }
});

test("architecture documents one executable token source of truth", () => {
  assert.match(architecture, /panda\.config\.ts.*owns executable tokens/s);
  assert.match(architecture, /Do not maintain a parallel hand-written palette/);
});

test("dark-mode focus and status indicators retain accessible contrast", () => {
  assert.ok(contrast("#8DAEFF", "#0E131B") >= 3, "brand.300 focus ring on the dark canvas must reach 3:1");
  assert.ok(contrast("#17663A", "#FFFFFF") >= 4.5, "success text on white must reach 4.5:1");
  assert.ok(contrast("#7A4D00", "#FFFFFF") >= 4.5, "warning text on white must reach 4.5:1");
  assert.ok(contrast("#B42318", "#FFFFFF") >= 4.5, "danger text on white must reach 4.5:1");
  assert.ok(contrast("#E9F8EF", "#0E131B") >= 4.5, "dark-mode success text must reach 4.5:1");
  assert.ok(contrast("#FFF5D6", "#0E131B") >= 4.5, "dark-mode warning text must reach 4.5:1");
  assert.ok(contrast("#FFF0EF", "#0E131B") >= 4.5, "dark-mode danger text must reach 4.5:1");
  assert.match(config, /focusRing:\s*\{ value: \{ base: "\{colors\.brand\.500\}", _dark: "\{colors\.brand\.300\}" \} \}/);
});
