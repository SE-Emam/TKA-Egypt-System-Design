# TKA Egypt — Design System

![TKA Egypt — Design System](assets/banner.png)

**Execution standard:** brand-first, accessible, restrained, and enforceable.

**Live brand page:** [se-emam.github.io/TKA-Egypt-System-Design](https://se-emam.github.io/TKA-Egypt-System-Design/)

This repository defines the visual and implementation contract for TKA Egypt products. It is the source of truth for brand tokens, Panda CSS recipes, visual-quality rules, accessibility gates, and AI-agent behavior. It does not claim to be the finished design of any product website.

**Brand assets:** [`assets/logo-blue.png`](assets/logo-blue.png) (primary, brand blue on transparent) · [`assets/logo-white.png`](assets/logo-white.png) (reversed, for dark and brand-blue surfaces) · [`assets/banner.png`](assets/banner.png)

## Brand invariants

| Decision | Rule |
|---|---|
| Primary brand blue | `#0846ED` |
| Brand yellow | `#FEB700` |
| Supporting palette | White and a measured neutral-gray scale |
| Styling system | Panda CSS v1 stable configuration |
| Visual direction | Editorial clarity and precision, with restrained enterprise structure |
| Directionality | RTL-first for Arabic experiences; LTR must be explicitly tested |
| Default components | Prohibited unless explicitly reviewed and adopted |
| AI-generated UI | Must comply with [Anti-AI-Slop rules](docs/anti-ai-slop.md) |

The brand colors are not interchangeable: blue carries primary actions and links; yellow is an accent and must not carry small white text. Use semantic tokens instead of raw color literals.

## Start here

1. [Brand and visual language](docs/brand-and-visual-language.md)
2. [Anti-AI-Slop rules](docs/anti-ai-slop.md)
3. [Architecture and token contract](docs/architecture.md)
4. [Accessibility and quality gates](docs/accessibility-and-quality-gates.md)
5. [Agent instructions](AGENTS.md)

## Local checks

Requires Node.js 22+ and npm.

```sh
npm install
npm run check
```

The check pipeline validates brand invariants, contrast expectations, architecture documentation, static anti-slop rules, TypeScript configuration, and Panda CSS code generation. The generated `styled-system/` directory is build output; do not hand-edit or commit it.

## Change policy

Changes to brand colors, semantic meanings, component recipes, exceptions, or accessibility gates require a focused pull request explaining the reason, affected surfaces, evidence, and regression coverage. No silent brand drift and no unreviewed global restyling.

## Status

This repository was empty at the start of the bootstrap. This pull request establishes the baseline system contract and tooling; it does not imply that any separate TKA product site has already integrated it.
