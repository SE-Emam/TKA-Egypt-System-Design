import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FORMATS, extractDesignTokens, loadProfile, renderDocument, inspectOfficePackage, validateDocument } from "../documents/src/renderers.mjs";
import { PDFDocument } from "pdf-lib";

const fixture = JSON.parse(readFileSync(new URL("../documents/examples/acceptance-sample.json", import.meta.url), "utf8"));
const tokens = extractDesignTokens();
const textFormats = new Set(["markdown", "html"]);

test("canonical TKA identity is extracted from panda.config.ts, not a parallel palette", () => {
  assert.equal(tokens.source, "panda.config.ts");
  assert.equal(tokens.colors.brand500, "#0846ED");
  assert.equal(tokens.colors.accent500, "#FEB700");
  assert.equal(tokens.fontName, "Readex Pro");
});

test("explicit profile protects both brand anchors and declares the five output formats", () => {
  const profile = loadProfile("tka-default");
  assert.deepEqual(new Set(profile.brand.protectedAnchors), new Set(["brand.500", "accent.500"]));
  assert.equal(profile.brand.allowAnchorOverrides, false);
  assert.equal(profile.brand.tokenSource, "panda.config.ts");
  assert.deepEqual(new Set(profile.documentDefaults.formats), new Set(FORMATS));
  assert.throws(() => loadProfile("no-such-profile"), /does not exist/);
  assert.throws(() => loadProfile("../panda.config"), /lowercase slug/);
});

test("document validation rejects unknown fields and malformed tables", () => {
  assert.throws(() => validateDocument({ ...fixture, unapprovedColor: "#ff00ff" }), /additional properties|unsupported field/);
  assert.throws(() => validateDocument({ ...fixture, direction: "sideways" }), /direction/);
  const malformed = structuredClone(fixture);
  malformed.sections[0].table.rows.push(["too", "few"]);
  assert.throws(() => validateDocument(malformed), /matching the header width/);
  const malformedSection = structuredClone(fixture);
  malformedSection.sections[0].untrackedBrandColor = "#112233";
  assert.throws(() => validateDocument(malformedSection), /additional properties|unsupported field/);
});

test("Markdown renderer preserves RTL metadata, headings, bullets, code and tables", async () => {
  const output = await renderDocument(fixture, "markdown");
  assert.equal(typeof output, "string");
  assert.match(output, /قبول نظام مستندات TKA/);
  assert.match(output, /> TKA Egypt · ar · RTL/);
  assert.match(output, new RegExp(String.fromCharCode(96).repeat(3)));
  assert.match(output, /\| البوابة \| الدليل \| الحالة \|/);
  assert.match(output, /Panda CSS/);
});

test("HTML renderer escapes untrusted content and injects the canonical token values", async () => {
  const malicious = structuredClone(fixture);
  malicious.sections[0].paragraphs.push('<script>alert("xss")</script> & "quoted"');
  const output = await renderDocument(malicious, "html");
  assert.equal(typeof output, "string");
  assert.match(output, /<html lang="ar" dir="rtl">/);
  assert.match(output, /--tka-brand-blue:#0846ED/);
  assert.match(output, /--tka-brand-yellow:#FEB700/);
  assert.match(output, /&lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(output, /<script>alert/);
  assert.match(output, /scope="col"/);
  assert.match(output, /@media print/);
});

test("LTR documents remain supported without changing the canonical TKA identity", async () => {
  const ltr = { ...fixture, title: "TKA LTR Acceptance", language: "en", direction: "ltr" };
  const markdown = await renderDocument(ltr, "markdown");
  const html = await renderDocument(ltr, "html");
  assert.match(markdown, /> TKA Egypt · en · LTR/);
  assert.match(html, /<html lang="en" dir="ltr">/);
  assert.match(html, /--tka-brand-blue:#0846ED/);
  assert.doesNotMatch(html, /--tka-brand-blue:#0055AA/);
});

test("renderer refuses implicit profile changes and unsupported formats", async () => {
  await assert.rejects(() => renderDocument({ ...fixture, profile: "other-profile" }, "markdown"), /does not exist/);
  await assert.rejects(() => renderDocument(fixture, "rtf"), /unsupported format/);
});

test("all five exporters produce a real non-empty artifact with required structural evidence", async () => {
  for (const format of FORMATS) {
    const artifact = await renderDocument(fixture, format);
    assert.ok(artifact && (typeof artifact === "string" ? artifact.length : artifact.byteLength) > 100, format + " output should not be an empty placeholder");
    if (textFormats.has(format)) {
      assert.match(artifact, /قبول نظام مستندات TKA/);
      continue;
    }
    if (format === "docx") {
      const inspected = await inspectOfficePackage(artifact, format);
      assert.ok(inspected.entries > 5);
      assert.match(inspected.documentXml, /w:document/);
      assert.match(inspected.documentXml, /قبول نظام مستندات TKA/);
      continue;
    }
    if (format === "pptx") {
      const inspected = await inspectOfficePackage(artifact, format);
      assert.ok(inspected.entries > 5);
      assert.ok(inspected.slides >= 2, "cover and at least one content slide are expected");
      assert.match(inspected.presentationXml, /p:presentation/);
      continue;
    }
    if (format === "pdf") {
      assert.equal(artifact.subarray(0, 5).toString("ascii"), "%PDF-");
      const pdf = await PDFDocument.load(artifact);
      assert.ok(pdf.getPageCount() >= 1);
      assert.equal(pdf.getTitle(), fixture.title);
      continue;
    }
  }
});

test("canonical brand-anchor drift fails closed", () => {
  const source = readFileSync(new URL("../panda.config.ts", import.meta.url), "utf8");
  assert.throws(() => extractDesignTokens(source.replace("#0846ED", "#0055AA")), /canonical TKA anchors changed/);
});
