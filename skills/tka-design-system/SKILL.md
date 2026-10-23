---
name: tka-design-system
description: Create or review TKA Egypt branded visual assets and design deliverables using the official TKA design system. Use for social banners, posters, marketing creatives, presentations, product UI, and other visual work in Arabic or English.
---

# TKA Egypt Design System Skill

## Purpose
Produce task-appropriate design deliverables that follow the repository's actual TKA Egypt identity. This skill is an agent-facing entry point, not a replacement for canonical rules, tokens, logo assets, or validation tools.

## Required first steps
1. Identify the repository root and current revision. Fetch/update the repository or inspect the current remote main before relying on local files. Never assume a stale checkout is current.
2. Read the canonical files relevant to the task: AGENTS.md, docs/brand-and-visual-language.md, docs/anti-ai-slop.md, docs/architecture.md when implementation or tokens are involved, and docs/accessibility-and-quality-gates.md when applicable.
3. Locate actual logo assets by inspecting the current repository tree and file types. The repository has a blue logo and a white logo. Choose the version with adequate contrast for the actual background. Verify that the chosen file is a real, readable image; do not treat text, Base64 text, a broken URL, or a placeholder as a valid logo.
4. Read relevant design tokens and assets from the repository. Do not invent file paths, logo variants, font availability, brand claims, or unprovided content.
5. Determine the requested deliverable, platform, audience, language, dimensions, and output format. Ask only for a missing detail that materially blocks execution; otherwise use a documented, sensible default and state it.

## Language policy
- Select Arabic or English according to the task and supplied content. This skill and repository can be used in either language.
- Preserve the user's requested language. Do not translate names, dates, times, claims, or technical terms unless asked or needed for clarity.
- For Arabic, use true RTL composition, suitable Arabic typography, correct punctuation and shaping, and directional isolation for URLs, phone numbers, Latin acronyms, and numbers where needed.
- For English, use LTR composition while retaining TKA brand rules.
- For mixed-language work, define the primary language and direction, and isolate embedded opposite-direction text.
- Proofread all visible copy. Do not let an image model be the final authority on exact text. If text rendering may be unreliable, create the visual with a reliable design/layout tool and place text as editable or programmatically rendered text.

## Brand rules
- Primary blue is exactly #0846ED.
- Brand yellow is exactly #FEB700, used as a restrained accent.
- Use white and neutral grays as supporting colors.
- Blue carries primary emphasis. Use a readable white foreground on blue. Use dark neutral text on yellow; never small white text on yellow.
- Use the repository's semantic tokens and approved typography when implementing code or using a supported renderer. Do not create a parallel token palette.
- The repository identifies Readex Pro for body/UI typography, El Messiri for display/editorial headings, and Amiri for quotations under its stated rules. Baloo Bhaijaan 2 is approved for marketing surfaces only where available and licensed; do not assume a font is installed.
- Use the official TKA logo asset. Preserve aspect ratio, colors, and clear space. Never redraw, recolor, crop, distort, or add effects. Do not generate a substitute logo.
- Choose blue or white logo according to actual background contrast. If neither is legible, adjust the background or use a documented approved placement; never modify the logo itself.
- Do not imply a partnership, accreditation, guarantee, certification, price, date, registration URL, or other claim unless supplied or verified. Preserve supplied claims faithfully without representing them as independently verified.
- Avoid generic AI slop: unrequested gradients, glow, glassmorphism, floating blobs, decorative dashboards, fake metrics, repetitive feature cards, excessive shadows, oversized pill shapes, and irrelevant stock-like imagery. Prefer purposeful composition, clear hierarchy, deliberate spacing, and readable content.

## Task workflow
1. Brief extraction: identify required message, audience, channel/platform, language, dimensions, CTA if supplied, assets, and constraints.
2. Asset/tool check: identify real logo files, fonts, image/design-generation tools, and export capabilities. If a capability is unavailable, state the limitation and choose a valid available workflow; never claim an output was created when it was not.
3. Composition: design for the target platform and task, not a generic template. Establish one primary message, a clear information hierarchy, supporting details, and a restrained CTA only if supplied.
4. Execution: use a suitable available image-generation, design, HTML/CSS, SVG, or presentation tool. For exact logos and text, prefer compositing the actual asset and reliably rendered text over asking an image model to recreate them.
5. Quality gates: check dimensions/export format; correct intact official logo and contrast; exact brand colors and restrained yellow; spelling, factual copy, date/time, punctuation, and language; Arabic RTL shaping and mixed-script direction; clipping, empty areas, low-resolution assets, illegible text; prohibited visual patterns and unsupported claims.
6. Delivery: provide the actual artifact, real path/link, dimensions and format, a concise summary of checks, and limitations. Never fabricate file links, test output, or visual inspection.

## Facebook banner example
For a Facebook banner advertising a free beginner course about using AI for daily task and business management:
- Keep supplied title and claims faithful.
- Make “free”, the Saturday 6:00 PM schedule, practical projects, and the TKA-Egypt certificate claim clear and correctly written if included in the brief.
- Use the actual blue or white TKA logo according to the background.
- Do not invent a registration link, phone number, start date, certificate authority details, or course duration.
- Confirm target placement and pixel dimensions if they are not specified and would affect the deliverable; otherwise state the chosen dimensions.
- If image generation struggles with Arabic text, create the visual/background separately and add Arabic copy using a reliable layout renderer.

## Code and product UI
Do not treat this marketing workflow as permission to bypass the implementation contract. Follow Panda CSS, semantic tokens, accessibility gates, RTL/LTR tests, and existing recipes. Do not add Tailwind, an unapproved UI library, or a second styling system.

## Completion report
Report each relevant gate as PASS, PARTIAL, FAIL, or BLOCKED with evidence. Distinguish automated checks from human visual review. If rendered output was not inspected, visual review is PARTIAL. Do not change protected brand rules or the design-system engine without explicit authorization.
