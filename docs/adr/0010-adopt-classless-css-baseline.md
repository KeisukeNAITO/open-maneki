# 0010. Adopt a classless CSS baseline (Pico)

Date: 2026-08-02 (issue #42)

## Context

The app was built feature-first with unstyled semantic HTML, which is fine for validating behaviour but hard to read as the app grows. Adding visual design is the next theme, and it starts with a hygiene slice: give every page a consistent baseline without rewriting page markup.

Dependencies in this project are chosen conservatively (long product life, small diffs for trunk-based practice). UI libraries were ranked by how deeply the dependency reaches into the code. Component libraries (Skeleton, Flowbite, shadcn-svelte) replace the HTML with framework components and are coupled to the Svelte major version — the deepest lock-in and the largest churn risk on framework upgrades. Utility frameworks (Tailwind) spread classes across every component and require touching all `.svelte` files plus build tooling. Classless CSS (Pico, Simple.css, Water.css) styles semantic element selectors directly: it applies to the existing markup unchanged, is plain CSS with no runtime dependency and no Svelte coupling, and is removed by deleting one import.

Among classless options, Pico ships built-in switch and dropdown components that fit likely near-term needs (toggles and menus) and exposes a `--pico-*` token system for later theming. Its trade-off is that upstream has been stalled since v2.1.1 (2025-03), with a community fork keeping it alive. This is accepted: a static CSS dependency with zero transitive packages accrues no security debt when unmaintained (no code execution path), and the worst case of a stall is "no new features", not breakage. Interactive behaviour (open/close state for toggles and hamburger menus) is written with Svelte `$state`, so the CSS library is only responsible for appearance and its maintenance status carries little risk.

## Decision

Adopt **Pico CSS** (the classed build, for its dropdown component) as the styling baseline. Import it once through `src/app.css`, loaded from `+layout.svelte`; the layout also applies Pico's container and nav conventions. Page components keep their plain semantic markup and are styled through element selectors, not classes. Custom design (token overrides, brand, monetary right-alignment) is deferred to later slices.

## Consequences

Every page gains a consistent, readable look with the styling confined to one CSS file plus the layout, keeping the diff small and the page components untouched. The dependency is reversible: because pages carry no Pico-specific classes, switching to hand-written CSS (or another baseline) later means rewriting `app.css`, with the page markup unaffected. Leaning on Pico's optional component classes (for example `class="dropdown"`) trades a little of that reversibility for convenience where used. Pico's own defaults (such as full-width buttons) may need overriding as the design language develops.
