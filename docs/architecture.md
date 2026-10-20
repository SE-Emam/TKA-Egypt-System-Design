# Design-system architecture

## Scope

This repository is a governed source package for the TKA Egypt design language. It is not a website starter or a claim that a separate product application has been migrated.

## Layering

1. **Brand anchors:** immutable brand values and brand-use rules.
2. **Primitive tokens:** palettes, type families, type scale, radii, and layout additions in `panda.config.ts`.
3. **Semantic tokens:** roles such as `canvas`, `foreground`, `border`, `actionPrimary`, `accent`, and status roles. Themes and components must depend on roles, not raw palette values.
4. **Recipes:** reusable patterns for repeated interactive parts. Initial recipes are `button` and `field`; add recipes only when a stable repeated pattern exists.
5. **Product composition:** pages compose semantic HTML and recipes around real tasks and content. Product content is not a token and must not be pushed into the theme.

## Source of truth

- `panda.config.ts` owns executable tokens, semantic roles, recipes, and global baseline styles.
- `docs/brand-and-visual-language.md` explains how to use the system.
- `docs/anti-ai-slop.md` defines prohibited shortcuts and the exception process.
- `AGENTS.md` provides instructions to coding agents.
- `scripts/check-design-system.mjs` and `tests/` make core invariants executable.
- `styled-system/` is generated output. Never edit it by hand.

Do not maintain a parallel hand-written palette in a second file. Documentation may repeat approved brand anchors for clarity; executable values remain centralized.

## Technology decision

Use Panda CSS stable v1 configuration for this baseline. Do not introduce Panda CSS beta/next majors or a second styling engine without a dedicated migration proposal and a green test matrix.

## Token policy

- Feature components should use semantic colors; primitive palette tokens are for token definitions, approved recipe internals, and intentional status contexts.
- Raw hexadecimal colors in product code are a violation.
- Add role tokens only for a meaningful, reusable design role—not for a single arbitrary element.
- Do not create tokens that are synonyms without semantic distinction.
- Keep the spacing scale systematic. Use the named `pageGutter` and `sectionGap` tokens for page-level layout when applicable.
- Dark semantic values are provided for core surfaces and text. A consuming app must still implement and test an intentional theme-switching contract; token definitions alone do not create a complete dark-mode experience.

## Component policy

- Prefer native semantics and small recipes before abstractions.
- Create a shared component only for a repeated interaction/pattern with consistent semantics, accessibility, states, and visual behavior.
- Every recipe must document variants, defaults, keyboard/focus behavior, states, and appropriate use.
- Avoid dozens of variants. Variants represent meaningful product decisions, not every CSS property.

## Change control

Brand anchors, semantic-role meaning, default variants, focus behavior, and quality gates are system-level decisions. Propose them in a pull request with a rationale and verification; do not change them incidentally during feature work.
