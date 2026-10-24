# Brand and visual language

## Brand hierarchy

TKA Egypt identity is the invariant. Panda CSS is the implementation tool, not the visual direction.

1. **Royal blue `#0846ED`:** primary action, active navigation, links, and key brand emphasis.
2. **Yellow `#FEB700`:** accent, limited emphasis, selected markers, and highlights that do not rely on color alone.
3. **Bright blue `#1C62FF` (`highlight`, decided 2026-10-24):** secondary accent only — secondary emphasis and large highlights where the royal blue would be too heavy. It is not a brand anchor, never a primary action, and never body or small text (contrast on white is 4.95:1). White is the approved foreground on it.
4. **White and neutral grays:** canvas, surfaces, borders, secondary text, and structure.
5. **Status colors:** reserved for success, warning, error, and informational meaning. Never use status colors as decoration.

Do not make every element blue or yellow. Brand is expressed through hierarchy and consistent application, not color saturation on every surface.

## Visual principles

### Precise, not ornamental

Use strong alignment, deliberate spacing, clear type hierarchy, readable measures, and consistent component geometry. A layout must have an identifiable information hierarchy before decoration is considered.

### Calm enterprise structure

Use borders and whitespace to define sections. Cards are appropriate for independently actionable or semantically grouped items—not as a wrapper around every paragraph, feature, statistic, or page section. Shadows are reserved for genuine elevation such as menus and dialogs, and must use an approved token.

### Editorial typography

Use the configured body and heading families. Establish hierarchy with a controlled scale, weight, line-height, and measure. Avoid oversized all-caps labels, gratuitous letter spacing, and multiple unrelated font families. Do not load fonts from a third-party CDN without a specific performance, privacy, licensing, and offline-fallback review.

#### Font stack (decided 2026-10-21)

Arabic is the primary script; every family below also carries Latin. All families are SIL Open Font License 1.1, so self-hosting is permitted and is the production default — no third-party font CDN in production.

| Token | Family | Role | Rules |
| --- | --- | --- | --- |
| `fonts.body` | Readex Pro | Body text and form controls | Variable 200–700; use 400/500/600. Arabic line-height 1.7–1.9. |
| `fonts.heading` | Readex Pro | UI headings (cards, forms, panels, tables) | Same family as body; hierarchy from weight 600/700 and size. |
| `fonts.display` | El Messiri | Display and editorial headings only (hero, page, course, article titles) | Weights 500–700. Never for small UI headings. |
| `fonts.quote` | Amiri | Quotations and classical callouts only | Minimum 20px; line-height ~1.9 even with full tashkeel. Lazy-load only — never in the critical font bundle. |

Deliberately excluded: Baloo Bhaijaan 2 is approved for marketing surfaces only (ad posters, social creatives) and is **not** a product token. Do not import it into product UI.

### Product-first composition

The user task determines the page structure. Do not default to the familiar AI landing-page formula of a giant gradient hero, floating glass cards, three identical feature cards, abstract blobs, invented metrics, logos without evidence, or a decorative dashboard with no operational meaning.

### RTL and language

Arabic is a first-class direction, not a mirrored afterthought. Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`, `text-align: start`). Set document direction intentionally at the page or application boundary. Keep phone numbers, URLs, code, and other LTR fragments directionally isolated where required. Test real Arabic content and mixed-script values.

## Color usage and contrast

- Use `actionPrimary` for primary interactive elements. White is the approved foreground on brand blue.
- Use `accent` sparingly. The approved foreground on yellow is dark neutral, never white.
- Use `highlight` (bright blue `#1C62FF`) sparingly for secondary emphasis only. It must never compete with `actionPrimary` in the same view, never replace a brand anchor, and never carry body or small text.
- Surface, foreground, and border roles come from semantic tokens, so light and dark values can evolve without component rewrites.
- Do not communicate status by color alone; include text, icons with accessible names, or another non-color cue.
- New palette values and role assignments require contrast calculations and review.

## Shape and depth

Use `control`, `surface`, and `dialog` radius tokens according to function. Do not round every element to a pill. A full pill radius is only allowed for a domain-justified control such as a compact filter chip, with that reason documented in the component's decision record.

Default to a visible border and clear surface relationship. Do not apply a universal shadow to cards or buttons.

## Decision rule

If decoration competes with task completion, information clarity, localization, keyboard access, performance, or brand recognition, remove the decoration.
