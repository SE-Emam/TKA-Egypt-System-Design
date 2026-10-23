# TKA Document System
## Purpose and implementation contract
The document system turns one validated, presentation-independent content object into Markdown, HTML, DOCX, PDF, or PPTX. The implementation is in \`documents/src/renderers.mjs\`, the CLI in \`scripts/render-document.mjs\`, and the single-source TKA design tokens remain in \`panda.config.ts\`.
A file extension alone is never acceptance evidence. The gates below distinguish renderer existence, generated artifacts, structural checks, and PDF-based rendering/extraction checks. Visual raster previews are archived by CI for human review; raster generation is not a substitute for a human visual review.
## Single source of truth and identity separation
- \`panda.config.ts\` is the only executable source for color and font tokens. The exporter reads its palette at runtime; it does not own another handwritten TKA palette.
- Protected anchors are immutable: \`brand.500 = #0846ED\` and \`accent.500 = #FEB700\`. A runtime mismatch fails closed.
- Profiles provide project identity metadata, permitted formats, language, and direction. They cannot replace the token source or override brand anchors.
- \`documents/profiles/tka-default.json\` is the explicit TKA Egypt fallback profile. Selecting a missing profile is an error; the renderer does not silently switch identities.
- Blue is used for primary identity and headings; yellow is a limited accent. The HTML uses dark text on yellow, readable neutral surfaces, semantic sections/tables, logical CSS properties, a print stylesheet, and reduced-motion handling.
- Text values are escaped in HTML output. The content schema and runtime validation reject unsupported top-level/section/table properties and malformed table dimensions.
## Content contract
Required document fields: \`title\`, \`language\`, \`direction\` (\`rtl\` or \`ltr\`), \`profile\`, and at least one \`sections\` entry. A section contains a \`heading\` and may contain \`paragraphs\`, \`bullets\`, \`code\`, or a table object with \`headers\` and \`rows\`. Table rows must match the header column count. Unknown fields fail validation rather than being silently dropped.
## Output formats and acceptance evidence
| Format | Exporter | Structural checks | Render/extraction checks |
| --- | --- | --- | --- |
| Markdown | Direct Markdown renderer | Content, headings, code fences, table shape | UTF-8 content preservation |
| HTML | Semantic HTML renderer; tokens injected from Panda config | HTML attributes, escaping/XSS regression, tables, canonical token colors | Headless Chromium prints actual HTML to PDF for text extraction, page-count, and browser-style preview checks |
| DOCX | OOXML renderer via `docx` | ZIP CRC and required OOXML parts, title/content/direction markers; code lines are separate shaded Consolas paragraphs forced LTR | LibreOffice PDF conversion, extraction and raster preview |
| PDF | PDF renderer through the DOCX exporter and LibreOffice PDF engine, using the same tested Arabic/RTL layout | PDF is re-opened by Poppler and checked for page count, Arabic glyphs, and extracted content | `pdfinfo`, `pdftotext`, all-page raster previews |
| PPTX | OOXML presentation renderer via PptxGenJS | Native PowerPoint tables, ZIP CRC, presentation/slide parts and slide count | LibreOffice PDF conversion, extraction and raster preview |
The CI workflow is the executable acceptance gate. Its exact run and artifacts should be linked from the PR. A passing static checker without successful real exports is not sufficient.
### PDF runtime requirement
PDF export uses LibreOffice (the `soffice` executable) to convert the same governed DOCX representation, avoiding a separate hand-built PDF text-layout path that can diverge on Arabic shaping, mixed RTL/LTR runs, and pagination. Install LibreOffice and an Arabic-capable system font before using PDF export. The repository does not bundle font binaries; verify font licensing and Arabic glyph coverage in the deployment environment. If `soffice` is missing or conversion fails, PDF generation fails explicitly instead of producing a misleading partial artifact.
## Usage
Requires Node.js 22+ and npm.
Install dependencies and run all checks:
\`\`\`sh
npm install
npm run check:documents
npm run check
npm run docs:fixtures -- --out .test-artifacts/documents
npm run docs:visual-check -- .test-artifacts/documents
\`\`\`
Render a document from JSON:
\`\`\`sh
npm run docs:render -- --input documents/examples/acceptance-sample.json --format html --out output/tka-report.html
npm run docs:render -- --input documents/examples/acceptance-sample.json --format docx --out output/tka-report.docx
npm run docs:render -- --input documents/examples/acceptance-sample.json --format pdf --out output/tka-report.pdf
npm run docs:render -- --input documents/examples/acceptance-sample.json --format pptx --out output/tka-report.pptx
npm run docs:render -- --input documents/examples/acceptance-sample.json --format markdown --out output/tka-report.md
\`\`\`
Change the profile intentionally with `--profile <id>`; the JSON document’s `profile` must match.
\`\`\`sh
\`\`\`
The CLI prints a JSON generation summary. Generation success is not proof of all render/visual gates; use the CI acceptance workflow and inspect its report and previews.
## CI and review checklist
- All profile files and JSON contracts parse and pass policy checks.
- The five real exporters generate artifacts from the same Arabic acceptance fixture.
- DOCX/PPTX packages pass ZIP CRC and OOXML structure checks.
- PDF is generated by LibreOffice from the same DOCX layout, re-opened by Poppler, and checked for page count, Arabic text, and full-page previews. HTML is printed to PDF by a headless Chromium browser so the preview exercises browser CSS rather than LibreOffice's HTML importer.
- HTML content is escaped and direction is set on the root document.
- CI converts DOCX/PPTX to PDF with LibreOffice and prints HTML with headless Chromium; Poppler checks text extraction/page counts and rasterizes every page for review.
Inspect all generated page previews for Arabic shaping, punctuation, mixed Arabic/Latin runs, tables, page breaks, and clipping; the automated workflow does not replace this visual gate.
## Current acceptance rule
A format is **PASS** only when its exporter runs, an artifact is generated, structural checks pass, and all required render/extraction checks pass. Human visual review should remain marked **PARTIAL** until preview images have actually been inspected. If the CI run has not run or is unavailable, report the relevant gate as **PARTIAL**, not PASS.