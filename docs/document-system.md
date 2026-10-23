# TKA Document System

## Status

This initial foundation defines a common document content contract, a project-profile contract, the TKA default profile, initial Markdown/HTML template contracts, and static governance checks. It does **not** yet ship complete DOCX, PDF, or PPTX exporters, a Markdown/HTML rendering engine, or visual-regression validation. Do not describe all five output formats as implemented until those capabilities and their acceptance tests are merged.

## Source of truth

- `panda.config.ts` remains the sole executable source for design tokens, semantic roles, and font families.
- Project profiles refer to token names; they must not copy hex values or redefine protected TKA anchors.
- Format adapters must consume tokens extracted from the canonical Panda configuration. They must not maintain independent palettes.
- Documentation describes policy; it is not a second executable token source.

## Project profiles

- `documents/profiles/tka-default.json` is the fallback profile.
- A project-specific profile may set project metadata, language, direction, and document defaults.
- A profile may not override `brand.500` or `accent.500`, and may not change the canonical token source.
- Unknown or malformed profile IDs are a hard error. Agents must not invent a profile when lookup fails; they must use the default profile and report the fallback.

## Content contract

`documents/schemas/document.schema.json` defines the common content model for a title, optional description, language, direction, profile, sections, paragraphs, code, and tables. Format adapters must preserve content and semantic order.

## Format implementation status

| Format | Status | Acceptance evidence required |
| --- | --- | --- |
| Markdown | Contract/template only | Rendered sample, structural checks, content preservation |
| HTML | Template contract only | Rendered sample, token injection, RTL/LTR and print checks |
| DOCX | Not implemented | Valid OOXML package, reopen/parse, content and style checks |
| PDF | Not implemented | Valid PDF, text extraction, font and page-boundary checks |
| PPTX | Not implemented | Valid OOXML package, reopen/parse, text-boundary and layout checks |

## Mandatory agent workflow

1. Read `AGENTS.md` and this document before creating a document.
2. Identify the target project and resolve its profile; use `tka-default` only as a documented fallback.
3. Validate the content against the document contract.
4. Use the approved format adapter and tokens; never apply ad-hoc brand colors.
5. Run `npm run check:documents` and the format-specific renderer/visual checks that exist.
6. Report each requested format as PASS, PARTIAL, or BLOCKED with artifact/test evidence. File creation alone is not acceptance.

## Acceptance gates

- Single token source remains `panda.config.ts`.
- All project profiles validate and protected anchors cannot be overridden.
- Every claimed format has a real exporter and a representative generated artifact.
- Arabic RTL, mixed Arabic/Latin, long headings, tables, code, multi-page output, and content preservation are tested.
- A deliberately invalid profile or brand override fails validation.
- Document checks run in CI and failures block the pull request.
