import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const profile = JSON.parse(read("documents/profiles/tka-default.json"));
const profileSchema = JSON.parse(read("documents/schemas/project-profile.schema.json"));
const documentSchema = JSON.parse(read("documents/schemas/document.schema.json"));

test("TKA default profile protects the canonical token source and brand anchors", () => {
  assert.equal(profile.brand.tokenSource, "panda.config.ts");
  assert.equal(profile.brand.allowAnchorOverrides, false);
  assert.deepEqual(new Set(profile.brand.protectedAnchors), new Set(["brand.500", "accent.500"]));
  assert.doesNotMatch(JSON.stringify(profile), /#[0-9a-f]{3,8}/i);
});

test("default profile declares five formats and Arabic RTL defaults", () => {
  assert.equal(profile.documentDefaults.language, "ar");
  assert.equal(profile.documentDefaults.direction, "rtl");
  assert.deepEqual(new Set(profile.documentDefaults.formats), new Set(["docx", "pdf", "markdown", "html", "pptx"]));
});

test("project-profile schema forbids anchor overrides and alternate token sources", () => {
  assert.equal(profileSchema.properties.brand.properties.allowAnchorOverrides.const, false);
  assert.equal(profileSchema.properties.brand.properties.tokenSource.const, "panda.config.ts");
});

test("document content contract requires language, direction, profile and sections", () => {
  assert.equal(documentSchema.additionalProperties, false);
  for (const field of ["title", "language", "direction", "profile", "sections"]) assert.ok(documentSchema.required.includes(field));
  assert.deepEqual(documentSchema.properties.direction.enum, ["ltr", "rtl"]);
});

test("initial templates use the document contract and avoid a parallel hex palette", () => {
  const markdown = read("documents/templates/markdown/document.md.tmpl");
  const html = read("documents/templates/html/document.html.tmpl");
  assert.match(markdown, /\{\{title\}\}/);
  assert.match(html, /lang="\{\{language\}\}" dir="\{\{direction\}\}"/);
  assert.match(html, /--tka-token-brand-500/);
  assert.doesNotMatch(html, /#[0-9a-f]{3,8}\b/i);
});

test("status docs do not misrepresent template contracts as working exporters", () => {
  const status = read("docs/document-system.md");
  assert.match(status, /does \*\*not\*\* yet ship complete DOCX, PDF, or PPTX exporters/);
  for (const format of ["DOCX", "PDF", "PPTX"]) assert.match(status, new RegExp(format + " \\| Not implemented"));
});

test("all project profile files use canonical source and protected anchors", () => {
  for (const name of readdirSync(new URL("../documents/profiles/", import.meta.url)).filter((item) => item.endsWith(".json"))) {
    const item = JSON.parse(readFileSync(new URL(name, new URL("../documents/profiles/", import.meta.url)), "utf8"));
    assert.equal(item.brand.tokenSource, "panda.config.ts");
    assert.equal(item.brand.allowAnchorOverrides, false);
    assert.ok(item.brand.protectedAnchors.includes("brand.500"));
    assert.ok(item.brand.protectedAnchors.includes("accent.500"));
  }
});
