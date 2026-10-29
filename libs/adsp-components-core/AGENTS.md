# AGENTS.md — adsp-components-core

Guidance for AI agents changing `libs/adsp-components-core` (`@abgov/adsp-components-core`).
[README.md](./README.md) explains how the theme works. This file covers where code goes, why, and the rules reviewers check.

## What this library is

The framework-independent foundation of the ADSP application components. It owns:

- the theme contract (`AdspTheme`) and the themes apps select from (`AdspThemes`)
- each component's tokens (`Adsp<Component>Theme`) and their defaults
- the bridge from theme to CSS (`toCssVariables`, `toComponentCssVariables`)
- each component's stylesheet, and `adsp-components.css`, the single entry stylesheet apps import
- plain TypeScript clients for the ADSP services that components need (for example `CalendarClient`)

Framework adapters (`adsp-components-react`, later Angular and Vue) render the components. Anything that would otherwise be written once per framework lives here; anything framework-specific lives in an adapter.

## Golden rules

1. **No framework code.** No React, Angular or Vue imports (lint enforces this), no JSX, no DOM access (`document`, `window`). Tests run in a Node environment.
2. **Values come from GoA design tokens.** Base theme roles reference `var(--goa-*)`. Component tokens and CSS reference only `--adsp-*`. Never hard-code colours, sizes or fonts.
3. **The theme controls presentation, never behaviour.** No data loading, permissions, ordering or feature flags in the theme.
4. **Everything exported is public API.** Exports from `src/index.ts`, `--adsp-*` property names, `.adsp-*` class names and the shape of `AdspTheme` are used by adapters and apps. Renaming any of them is a breaking change.
5. **No runtime dependencies** without a strong reason. `@abgov/design-tokens` is a peer dependency, referenced only through `var(--goa-*)` strings and never imported.
6. **Only what components need.** Core is not a general utility library.

## Does it belong in core?

Put it here if it would be identical in React, Angular and Vue:

- theme types, theme values and component tokens
- component CSS
- service clients, their domain models and pure data logic (date ranges, time zones, mapping)

Put it in an adapter (for example `libs/adsp-components-react`) if it:

- imports a UI framework, renders anything or touches the DOM
- is shaped for one UI library's API (for example a FullCalendar `EventInput` or an rrule object)
- is a hook, provider, component or framework-specific type

Put it in `apps/sandbox-app` if it's demo or example code.

## Where to put files

Each component owns one folder, `src/lib/<component>/`, holding everything core knows about it. `src/lib/theme/` holds the shared theme. Follow `src/lib/calendar/`:

```text
src/
  adsp-components.css      entry stylesheet: only @imports, one per component
  index.ts                 re-exports theme/ and each component folder
  lib/
    theme/                 shared theme contract, themes and the CSS bridge
    calendar/
      calendarTheme.ts     AdspCalendarTheme and defaultCalendarTheme
      adsp-calendar.css    the component's styles
      calendarClient.ts    client for the Calendar service, when the component needs data
      types.ts             domain models and the client interface
      mapper.ts            service wire format to domain models (not exported)
      index.ts             the folder's public exports
      README.md            client usage, behaviour and limitations
      *.spec.ts
```

| You are adding…                         | Put it in                                                                                   | Also update                                                                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A component                             | A new `src/lib/<component>/` folder with `index.ts`                                         | `src/index.ts` (`export * from './lib/<component>'`)                                                                                                  |
| A component's tokens and variant types  | `src/lib/<component>/<component>Theme.ts`                                                   | `AdspThemeComponents` in `adsp-theme.ts`, `AdspThemes.standard`, the folder's `index.ts` (`export type`), the component list in `adsp-themes.spec.ts` |
| A component's styles                    | `src/lib/<component>/adsp-<component>.css`                                                  | An `@import` in `src/adsp-components.css`                                                                                                             |
| A client for an ADSP service            | `src/lib/<component>/`: `<component>Client.ts`, `types.ts`, `mapper.ts`, `README.md`, specs | The folder's `index.ts`                                                                                                                               |
| A base theme role (colour, type, space) | `src/lib/theme/adsp-theme.ts` (type) and `src/lib/theme/adsp-themes.ts` (value)             | Theme contract table in the README                                                                                                                    |
| A theme helper                          | `src/lib/theme/<helper>.ts` with `<helper>.spec.ts`                                         | `src/index.ts` if public                                                                                                                              |

- **Shared clients:** if several components use the same service client, give the client its own folder, `src/lib/<service>/`.
- **File names:** `theme/` uses kebab-case. Component folders use the names above (`<component>Theme.ts`, `<component>Client.ts`, `adsp-<component>.css`). Tests sit next to the source as `*.spec.ts`.

## Theme and token rules

- **Base roles** (`color`, `typography`, `spacing`, `borderRadius`) are exactly one `var(--goa-*)` reference: no literals, no fallbacks. A spec checks that each referenced GoA token exists in `@abgov/design-tokens`.
- **Component tokens** alias base roles (`var(--adsp-color-surface-card)`), or use a CSS keyword such as `transparent` when no role fits. Never `--goa-*`; a spec rejects it.
- **Use the right scale.** Spacing tokens for spacing, `borderRadius` for corners, and the type scale that matches the element (body text doesn't use heading weights).
- **Every token is used.** Add a token only if a CSS rule reads it, and remove tokens when their CSS goes. An unused token looks customizable but does nothing.
- **Name tokens `<part><Property>`** in camelCase, using the CSS property words `background`, `textColor`, `borderColor`, `borderRadius`, `padding` and `fontWeight`, prefixed by the part or state they apply to (`eventBackground`, `eventTextColor`, `hoverBackground`). Each name must be unambiguous as the generated `--adsp-components-<component>-*` property.
- **Group variants** as nested objects (`<component>.<variant>.background`), not prefixed flat keys.
- **Default objects are internal.** Export only the types for defaults such as `defaultCalendarTheme`; apps get the defaults through `AdspThemes.standard`.
- **Themes are deep-frozen.** Derive new ones with `createAdspTheme`; never mutate.

## CSS rules

Each component has its own stylesheet in its folder: `src/lib/<component>/adsp-<component>.css`. `src/adsp-components.css` is the single entry point apps import. Apart from its header comment, it holds only `@import` statements, one per component:

```css
@import './lib/calendar/adsp-calendar.css';
```

- **Keep the entry file to `@import`s.** No rules in `adsp-components.css`. CSS ignores an `@import` that comes after a rule.
- **Every stylesheet must ship.** The `build` target in `project.json` copies `**/*.css` from `src`, keeping relative paths, so the `@import`s resolve in `dist`. Don't narrow that glob. If an imported file is missing from `dist`, the published `adsp-components.css` breaks while the monorepo still works, because `tsconfig.base.json` maps the import to the source file.

In every component stylesheet:

- **Style only that component.** Scope every rule under its root class (`.adsp-<component>`). Class names use the `adsp-` prefix and BEM (`adsp-<component>__<element>`, `adsp-<component>--<modifier>`). Stylesheets don't depend on each other.
- **Read only `--adsp-*`.** Use `--adsp-components-<component>-*` for anything teams may customize and base `--adsp-*` roles for the rest. **Never read `--goa-*`**: it bypasses the selected theme. The specs don't check the CSS, so check this yourself.
- **Every property you read must exist.** Each `--adsp-components-<component>-*` property the CSS reads must be defined in the theme; otherwise it is silently unset. Properties the stylesheet sets for its own use (such as the `--fc-classic-*` values `adsp-calendar.css` sets for FullCalendar) are fine.
- **Set explicit values** (`margin`, `list-style`, `font-family`) so an app's global CSS doesn't leak in.
- **No hard-coded colours, sizes or radii**, apart from structural values such as `0`, `1px` borders and `transparent`.

When wrapping a third-party UI library (for example FullCalendar):

- Map the library's CSS variables to `--adsp-*` tokens inside the component's root class.
- Map **every** variable the library's stylesheet reads, or load the library's defaults first. An unmapped variable makes its declaration invalid, so the property silently falls back (often to transparent).
- Avoid selectors that depend on the library's generated DOM or hashed class names; prefer the library's class-name hooks. If you can't avoid them, comment why and pin the library version in the adapter that depends on it.

## Service client rules (`src/lib/<component>/`)

Use `src/lib/calendar/` as the reference.

- **Depend only on `fetch`.** Accept `fetch` and `getAccessToken` as options so callers and tests can inject them.
- **Expose an interface** (`I<Name>Client`, for example `ICalendarClient`) for consumers and tests to depend on, plus the class that implements it.
- **Keep the wire format private.** The service's response types (`*Service*`) stay in `mapper.ts` and aren't exported. Map them to domain models with `Date` values in `types.ts`.
- **Use the service's results.** Don't re-implement rules the service already applies (for example recurrence expansion or holiday calculation).
- **Dates:** treat Alberta business days in `America/Edmonton` using `Intl`. Never hard-code a UTC offset such as `-06:00`, and remember that date-only strings (`'2026-11-01'`) parse as UTC midnight. Ranges are start-inclusive and end-exclusive.
- **Pages and errors:** follow every page. On a failed response, throw an `Error` that includes the status code.
- **Document it:** options, behaviour and limitations go in the area's `README.md`.

## Public API and breaking changes

- **Breaking:** changing or removing an export, an `--adsp-*` property name, an `.adsp-*` class or a client interface method. Add a `BREAKING CHANGE:` footer, and update the READMEs and the adapters in the same PR.
- **Non-breaking:** adding optional tokens, exports or options.
- **Commit scope** is the project name: `feat(adsp-components-core): …`. When the adapter changes too, list both scopes.
- The package isn't published yet (no `release` target), but `adsp-components-react` and `sandbox-app` use it from source, so breaking changes surface immediately.

## Tests

Follow the [unit testing standards](../../architecture/unit-testing-standards.md): co-located `*.spec.ts`, Arrange/Act/Assert, descriptive names, no logic in tests.

- **New component:** update the expected component list in `adsp-themes.spec.ts`. The token-reference specs then cover the new tokens automatically.
- **Service clients:** inject a fake `fetch`. Cover range boundaries, pagination, time zone and daylight-saving cases, and error responses. Shape fake responses like the real service's, not idealised data.

## Before you finish

```bash
npx nx test adsp-components-core
npx nx lint adsp-components-core
npx nx build adsp-components-core
npx nx test adsp-components-react   # the adapter depends on core
```

- [ ] Nothing framework- or library-specific added to core
- [ ] New tokens alias `--adsp-*` roles, and the CSS reads no `--goa-*`
- [ ] Every new token is read by the CSS, and every token the CSS reads exists in the theme
- [ ] A new stylesheet is `@import`ed in `adsp-components.css` and ships in the build
- [ ] The folder's `index.ts` exports the new types (`export type`; default tokens stay internal), and `src/index.ts` re-exports the folder
- [ ] README (and the area README) updated for any public API change
- [ ] Breaking changes marked with `BREAKING CHANGE:`

## References

- [README.md](./README.md): theme model, customizing, adding a component
- [src/lib/calendar/README.md](./src/lib/calendar/README.md): the reference service client
- [adsp-components-react README](../adsp-components-react/README.md): the React adapter
- [Clean code rules](../../architecture/clean-code-rules.md)
- [Root AGENTS.md](../../AGENTS.md): repo-wide conventions and Nx commands
