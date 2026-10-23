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
| HTML | Semantic HTML renderer; tokens injected from Panda config | HTML attributes, escaping/XSS regression, tables, canonical token colors | CI converts to PDF and verifies readable non-empty extraction, page count and preview |
| DOCX | OOXML renderer via \`docx\` | ZIP CRC and required OOXML parts, title/content/direction markers | LibreOffice PDF conversion, extraction and raster preview |
| PDF | PDF renderer via \`pdf-lib\`, embedded font + Arabic shaping/BiDi helpers | PDF header, reload, metadata and page count | \`pdfinfo\`, \`pdftotext\`, first-page raster preview |
| PPTX | OOXML presentation renderer via PptxGenJS | Native PowerPoint tables, ZIP CRC, presentation/slide parts and slide count | LibreOffice PDF conversion, extraction and raster preview |

The CI workflow is the executable acceptance gate. Its exact run and artifacts should be linked from the PR. A passing static checker without successful real exports is not sufficient.

### PDF font requirement

PDF output must embed an Arabic-capable TrueType font, so text does not depend on the reader’s local fonts. The CLI looks for known system font paths; on CI the workflow installs DejaVu fonts. For a custom font, use \`--font /absolute/path/to/font.ttf\` or set \`TKA_DOCUMENT_FONT\`. Font files are intentionally not bundled into this repository; validate your font’s license and Arabic glyph coverage before production use. The PDF renderer performs Arabic shaping, but its shaping implementation is not a substitute for full HarfBuzz shaping for every script/ligature combination.

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

Change the profile intentionally with \`--profile <id>\`; the JSON document’s \`profile\` must match. For example, PDF with a custom font:

\`\`\`sh
npm run docs:render -- --input documents/examples/acceptance-sample.json --format pdf --out output/tka-report.pdf --font /absolute/path/to/ArabicFont.ttf
\`\`\`

The CLI prints a JSON generation summary. Generation success is not proof of all render/visual gates; use the CI acceptance workflow and inspect its report and previews.

## CI and review checklist

- All profile files and JSON contracts parse and pass policy checks.
- The five real exporters generate artifacts from the same Arabic acceptance fixture.
- DOCX/PPTX packages pass ZIP CRC and OOXML structure checks.
- PDF can be reopened and exposes metadata and pages.
- HTML content is escaped and direction is set on the root document.
- CI converts DOCX/PPTX/HTML to PDF with LibreOffice, checks text extraction and page counts with Poppler, and produces first-page preview PNGs.
- Human review should inspect Arabic shaping, punctuation, mixed Arabic/Latin runs, tables, page breaks, and clipping in those previews. Automated text extraction cannot prove the visual quality of every glyph or slide layout.

## Current acceptance rule

A format is **PASS** only when its exporter runs, an artifact is generated, structural checks pass, and all required render/extraction checks pass. Human visual review should remain marked **PARTIAL** until preview images have actually been inspected. If the CI run has not run or is unavailable, report the relevant gate as **PARTIAL**, not PASS.
