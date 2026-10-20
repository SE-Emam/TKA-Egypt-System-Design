# Instructions for coding agents — TKA Egypt

These instructions are mandatory for any agent or contributor working in this repository or a product consuming this system.

## Before editing

1. Inspect the repository, its active branch, package scripts, and relevant source files. Do not infer the stack or fabricate paths.
2. Read this file plus `docs/brand-and-visual-language.md`, `docs/anti-ai-slop.md`, `docs/architecture.md`, and `docs/accessibility-and-quality-gates.md`.
3. Reuse existing primitives, semantic tokens, and recipes before introducing anything new.
4. Identify the actual user goal, primary action, content hierarchy, responsive states, loading/empty/error states, keyboard path, and RTL/LTR behavior before implementation.

## Hard brand rules

- Exact brand anchors: royal blue `#0846ED`; yellow `#FEB700`. Never silently alter, approximate, swap, or add a competing primary color.
- Use Panda CSS and tokens. Do not introduce Tailwind, a second styling engine, global ad-hoc utility systems, or an unapproved UI library.
- Use semantic tokens in application code. Never hard-code raw colors, one-off spacing, border radii, shadows, or typography in feature components.
- Blue is the primary-action color. Yellow is an accent; use dark readable text on yellow. Never put small white text on yellow.
- Prefer borders and spacing over decorative cards and shadows. Use icons from an established, already-present icon package only; do not use emoji as UI icons.
- No invented gradients, glow, glassmorphism, blur, oversized rounded pills, random floating shapes, decorative charts, fake metrics, or generic AI landing-page sections.
- Do not add component libraries or dependencies without explaining the functional gap and reviewing bundle, accessibility, license, and maintenance impact.

## Implementation rules

- Check installed package versions and official docs before writing version-sensitive code. Do not upgrade to a major or beta release without an explicit decision.
- Define new reusable components only when a real repeated pattern exists. Keep one-off compositions local.
- Prefer semantic HTML and native controls. A visual custom control must retain keyboard access, accessible name, state, and focus visibility.
- Support Arabic RTL from layout decisions, not last-minute CSS patches. Use logical properties and test long Arabic copy, mixed Arabic/Latin text, numbers, and form errors.
- Design all required states: default, hover, focus-visible, active, disabled, loading, error, empty, and success as applicable.
- Respect reduced-motion preferences. Animation must communicate state, not decorate empty space.
- Never falsify test results, screenshots, browser checks, measurements, or integration status. Label unverified work as unverified.

## Required before reporting completion

Run `npm run check`. Review the actual diff for token bypasses, arbitrary values, layout regressions, and anti-slop violations. When a real product UI is involved, provide screenshots at narrow and wide viewports, test keyboard-only operation and RTL, and report what could not be tested.

Report PASS / PARTIAL / BLOCKED for each gate. Do not claim the design system has been integrated into another repository unless that integration was actually made and verified.
