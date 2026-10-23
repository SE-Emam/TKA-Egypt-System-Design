# Agent Skill integration

## Goal
Make the TKA Egypt design system straightforward to use from compatible AI agents without duplicating or weakening canonical design rules.

The first integration is a portable Agent Skill at skills/tka-design-system/SKILL.md. It directs agents to governing files and verified assets rather than maintaining a competing copy of the brand specification.

## Language
The skill supports Arabic and English. The task and supplied content determine language and direction. Arabic work must be reviewed for RTL composition, Arabic shaping, and mixed Arabic/Latin content; English work uses LTR. Do not force one language across all tasks.

## Logo policy
The repository contains blue and white logo variants. Agents must inspect the current repository tree, verify the actual image files, and select the variant that remains legible against the chosen background. The skill intentionally does not hard-code an asset path until verified against the current tree. Agents must never reconstruct a logo from text or ask an image model to redraw it.

## Source of truth
The skill supplements, and does not override:
- AGENTS.md
- docs/brand-and-visual-language.md
- docs/anti-ai-slop.md
- docs/architecture.md
- docs/accessibility-and-quality-gates.md
- panda.config.ts and existing semantic tokens
- Actual approved logo and font assets found in the repository

For document exports, follow docs/document-system.md and its acceptance gates. For application UI, follow the Panda CSS and accessibility contracts.

## Quality and reporting
Agents must distinguish generated output from validated output, and automated checks from visual inspection. They must not claim PASS without evidence, invent facts or URLs, or silently change brand anchors.

## Initial acceptance test
Use the skill to produce a Facebook promotional banner from a supplied brief in Arabic and then a separate English brief. Check:
1. correct logo variant and undistorted asset;
2. exact blue and yellow anchors;
3. language selection and RTL/LTR behavior;
4. exact copy and no invented registration details;
5. appropriate export dimensions and readable copy;
6. no prohibited generic AI visual tropes;
7. actual file delivery and truthful evidence-based completion report.

This integration does not itself imply that an image-generation provider, design application, MCP server, or automatic renderer has been connected. Add those integrations later only if a demonstrated workflow requires them.
