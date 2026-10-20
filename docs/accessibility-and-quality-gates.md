# Accessibility and quality gates

Target WCAG 2.2 AA for user-facing product interfaces. This repository's static checks are an early guardrail, not a substitute for browser testing, assistive-technology testing, or a full accessibility audit.

Reference: https://www.w3.org/TR/WCAG22/

## Required gates

### Contrast and meaning

- Normal text: at least 4.5:1 contrast.
- Large text: at least 3:1 contrast.
- Essential non-text UI boundaries and state indicators: target at least 3:1 against adjacent colors where WCAG requires it.
- Do not rely on color alone to communicate error, status, selection, or success.
- Recalculate contrast for every proposed palette or semantic-token change.

### Keyboard and focus

- Every interactive element must be reachable and operable by keyboard.
- Focus must remain visible and must not be hidden by overlays or sticky regions.
- Focus styles must not be removed without an equally visible replacement.
- Dialogs and menus must define focus entry, containment where appropriate, escape/close behavior, and focus restoration.
- Do not use clickable `div` or `span` elements when a native button or link is appropriate.

### Targets and forms

- Core button and text-field recipes have a minimum height of 44 CSS px as the default target.
- Labels must be programmatically associated with inputs.
- Errors must be identified in text and associated with the relevant field; color alone is insufficient.
- Disabled, invalid, loading, and success states must have clear semantics and not rely solely on opacity or color.

### Motion and responsive behavior

- Respect `prefers-reduced-motion`.
- No content should require hover to become discoverable.
- Test at narrow mobile widths, common tablet widths, and desktop.
- Ensure zoom/reflow, long Arabic words, mixed-script strings, and large text do not create overlap or horizontal scrolling without a justified exception.

### Localization

- Arabic RTL is a first-class acceptance case.
- Use logical CSS properties instead of hard-coded left/right positioning wherever possible.
- Verify reading order, alignment, breadcrumb direction, icons that imply direction, numeric content, validation messages, and keyboard order.
- Also test English LTR; do not assume mirroring is always correct for product semantics.

## Release checklist

- [ ] `npm run check` passes.
- [ ] No token bypass or unexplained hard-coded visual values.
- [ ] Brand blue and yellow remain exact.
- [ ] Contrast has been measured for any new combination.
- [ ] Keyboard and visible focus have been manually tested.
- [ ] Arabic RTL and English LTR have been checked.
- [ ] Loading, empty, error, disabled, and success states have been reviewed where relevant.
- [ ] Reduced motion is honored.
- [ ] Responsive behavior has been inspected at narrow and wide viewports.
- [ ] Screenshots or recordings document actual tested states; no invented evidence.
- [ ] Known limitations are disclosed in the pull request.
