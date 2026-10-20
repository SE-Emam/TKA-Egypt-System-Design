# Anti-AI-Slop standard

This document is a binding quality gate, not a mood board. “Looks modern” is not sufficient evidence for a design decision.

## Prohibited by default

- Generic AI/SaaS compositions copied without a product-specific rationale.
- Blue-purple or rainbow gradients, text gradients, neon accents, glow, glassmorphism, backdrop blur, and decorative blobs.
- A hero made enormous only to create whitespace; headline/subheadline/button layouts without a validated user purpose.
- Repeated three-card feature grids, card-on-card nesting, excessive pill controls, universal rounded corners, and shadows used as decoration.
- Decorative charts, fake KPI numbers, fabricated customer logos, invented reviews, fake activity, lorem ipsum, or visual content that suggests evidence that does not exist.
- Emoji used as interface icons; random icon styles or mixed icon libraries; icon-only actions without accessible names.
- Gratuitous entrance animation, parallax, hover lift, shimmer, autoplay, and motion that ignores reduced-motion preferences.
- Raw color literals, arbitrary typography, one-off spacing, arbitrary radii, or ad-hoc shadow values in product components.
- Introducing a default component library or template to avoid designing a real information hierarchy.
- Placeholder UI states shipped as if complete, unexplained disabled controls, and controls that look interactive but do nothing.

## Required alternative

1. Start from the user task and the content that actually exists.
2. Establish one primary action per meaningful context; secondary actions must remain visually subordinate.
3. Build hierarchy with layout, type, spacing, contrast, and alignment before adding decoration.
4. Use existing semantic tokens and Panda recipes. Extend the system only when a repeated, justified need is present.
5. Prefer a clear page canvas and discrete sections over wrapping everything in cards.
6. Use icons only when they improve recognition, and use one consistent, licensed icon set already approved for the host product.
7. Use actual content or label placeholders explicitly. Never invent proof, customer counts, testimonials, or metrics.
8. Keep transitions short and functional. Honor reduced-motion settings.
9. Validate narrow and wide viewports, keyboard flow, focus visibility, Arabic RTL, LTR fragments, and error/empty/loading states.
10. Explain the rationale for any visual exception in the pull request.

## Agent rejection checklist

A code review must request changes if any answer below is “yes” without an explicit, approved exception:

- Does the work introduce gradients, glow, blur, glass-like panels, or random decorative geometry?
- Does it wrap most sections in identical cards or use several competing primary buttons?
- Does it add content or metrics not supplied by a trustworthy source?
- Does it bypass the established tokens or recipes?
- Does it introduce a new library, font, or visual system without approval?
- Is the layout directionally incorrect or awkward in Arabic?
- Does animation add no meaningful information?
- Is keyboard or focus behavior missing?
- Does the visual look like a generic AI template instead of a specific TKA product?

## Exceptions

Exceptions are rare and must be explicit. The pull request must identify the exact element, product need, accessibility/performance impact, evidence, and why a token-based non-decorative solution is insufficient. Approval applies only to the named exception, not to a new global precedent. Silence is not approval.
