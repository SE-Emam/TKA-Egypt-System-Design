# Brand and visual language

## Brand hierarchy

TKA Egypt identity is the invariant. Panda CSS is the implementation tool, not the visual direction.

1. **Royal blue `#0846ED`:** primary action, active navigation, links, and key brand emphasis.
2. **Yellow `#FEB700`:** accent, limited emphasis, selected markers, and highlights that do not rely on color alone.
3. **White and neutral grays:** canvas, surfaces, borders, secondary text, and structure.
4. **Status colors:** reserved for success, warning, error, and informational meaning. Never use status colors as decoration.

Do not make every element blue or yellow. Brand is expressed through hierarchy and consistent application, not color saturation on every surface.

## Visual principles

### Precise, not ornamental

Use strong alignment, deliberate spacing, clear type hierarchy, readable measures, and consistent component geometry. A layout must have an identifiable information hierarchy before decoration is considered.

### Calm enterprise structure

Use borders and whitespace to define sections. Cards are appropriate for independently actionable or semantically grouped items—not as a wrapper around every paragraph, feature, statistic, or page section. Shadows are reserved for genuine elevation such as menus and dialogs, and must use an approved token.

### Editorial typography

Use the configured body and heading families. Establish hierarchy with a controlled scale, weight, line-height, and measure. Avoid oversized all-caps labels, gratuitous letter spacing, and multiple unrelated font families. Do not load fonts from a third-party CDN without a specific performance, privacy, licensing, and offline-fallback review.

### Product-first composition

The user task determines the page structure. Do not default to the familiar AI landing-page formula of a giant gradient hero, floating glass cards, three identical feature cards, abstract blobs, invented metrics, logos without evidence, or a decorative dashboard with no operational meaning.

### RTL and language

Arabic is a first-class direction, not a mirrored afterthought. Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`, `text-align: start`). Set document direction intentionally at the page or application boundary. Keep phone numbers, URLs, code, and other LTR fragments directionally isolated where required. Test real Arabic content and mixed-script values.

## Color usage and contrast

- Use `actionPrimary` for primary interactive elements. White is the approved foreground on brand blue.
- Use `accent` sparingly. The approved foreground on yellow is dark neutral, never white.
- Surface, foreground, and border roles come from semantic tokens, so light and dark values can evolve without component rewrites.
- Do not communicate status by color alone; include text, icons with accessible names, or another non-color cue.
- New palette values and role assignments require contrast calculations and review.

## Shape and depth

Use `control`, `surface`, and `dialog` radius tokens according to function. Do not round every element to a pill. A full pill radius is only allowed for a domain-justified control such as a compact filter chip, with that reason documented in the component's decision record.

Default to a visible border and clear surface relationship. Do not apply a universal shadow to cards or buttons.

## Decision rule

If decoration competes with task completion, information clarity, localization, keyboard access, performance, or brand recognition, remove the decoration.
