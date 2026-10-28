# AGENTS.md — adsp-components-react

Guidance for AI agents changing `libs/adsp-components-react` (`@abgov/adsp-components-react`).
[README.md](./README.md) explains how apps use the library. This file covers where code goes, why, and the rules reviewers check. Read it with the [core library's AGENTS.md](../adsp-components-core/AGENTS.md): most new components start there.

## What this library is

The React adapter for the ADSP application components. It owns:

- `AdspThemeProvider`, `useAdspTheme` and `useAdspThemeStyle`, which select a theme and apply it to each component as `--adsp-*` properties
- the React components, for example `AdspGoACalendar`
- data hooks built on core's service clients, for example `useCalendarEvents`
- integration with third-party React UI libraries, for example FullCalendar

It doesn't own theme values, tokens, CSS, service clients, domain models or date logic. Those live in `@abgov/adsp-components-core` so the Angular and Vue adapters can share them.

## Golden rules

1. **Core first.** If an Angular or Vue adapter would need the same thing, it belongs in core: tokens, CSS, shared types, service clients and data logic. This library renders.
2. **Theme through `useAdspThemeStyle`.** Spread `useAdspThemeStyle('<component>', themeOverrides)` on the component's root element, which also carries the `adsp-<component>` class. That's how the theme and core's stylesheet reach the component.
3. **Styles come only from core's stylesheet.** No inline styles other than the theme style, no CSS-in-JS or styled-components, and no stylesheets in this library. A third-party library's own CSS is the one exception (see below).
4. **No `className`, `style` or render-override props.** Teams change how a component looks through the theme, provider `overrides` or the component's typed `themeOverrides`.
5. **Inject clients; depend on interfaces.** Components and hooks take a core client interface (for example `ICalendarClient`) as a prop or argument. Never create clients, read environment or directory configuration, or call `fetch` here.
6. **Everything exported is public API.** Exports from `src/index.ts`, component props and hook results are used by apps. Renaming or changing any of them is a breaking change.

## Where to put files

Each component owns one folder, `src/lib/<component>/`, matching the component's folder in core. Follow `src/lib/calendar/`:

```text
src/
  index.ts                     public exports
  lib/
    theme/
      adsp-theme-provider.tsx  provider and theme hooks
    calendar/
      adsp-goa-calendar.tsx    the component (AdspGoACalendar)
      types.ts                 props interface and constants
      useCalendarEvents.tsx    data hook built on core's ICalendarClient
      calendarUtils.ts         React-side helpers
      css.d.ts                 module declaration for the third-party CSS imports
      *.spec.ts(x)
```

| You are adding…                                      | Put it in                                                                                 | Also update                                                                                                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A component                                          | `src/lib/<component>/adsp-<component>.tsx` with `adsp-<component>.spec.tsx`               | Core first: its tokens, styles and shared types (see core's AGENTS.md). Then `src/index.ts`, the README API tables and a sandbox example                       |
| Its props and constants                              | `src/lib/<component>/types.ts`                                                            | —                                                                                                                                                              |
| A data hook                                          | `src/lib/<component>/use<Thing>.tsx` with a spec                                          | `src/index.ts` if apps should use it directly                                                                                                                  |
| Mapping core models to a third-party library's input | `src/lib/<component>/`, for example `mapper.ts`                                           | —                                                                                                                                                              |
| Provider or theme hook changes                       | `src/lib/theme/adsp-theme-provider.tsx`                                                   | The README's Theme API table                                                                                                                                   |
| A sandbox example                                    | `apps/sandbox-app/src/app/components/services/adsp-components/Adsp<Component>Example.tsx` | The route in `SandboxTenant.tsx`, the page in `addAdspComponentsPages` (`utils/servicePageUtils.ts`) and its spec, and the sandbox `adsp-components/README.md` |

- **File names:** component files are kebab-case (`adsp-<component>.tsx`). Hooks follow React's convention (`use<Thing>.tsx`). Tests sit next to the source.
- **Component names** start with `Adsp` and are named exports.
- **Sandbox examples** import from `@abgov/adsp-components-react`, never by relative path, so they match real usage.

## Component rules

Use `src/lib/calendar/adsp-goa-calendar.tsx` as the reference implementation.

- **Root element:** `className="adsp-<component>"`, `style={themeStyle}` from `useAdspThemeStyle` and `data-testid={testId}`.
- **Props:** `themeOverrides?: AdspComponentThemeOverrides<'<component>'>` and `testId?: string`, plus the component's own inputs. Use core types for shared values (`CalendarView`, `DateRange`), never a third-party library's types. Map to the library's values inside the component, as `FULL_CALENDAR_VIEW` does.
- **Defaults give a correct first render.** With only the required props, the component should show what a user expects, for example the current period with its data. Test the defaults, not only explicit props.
- **Show loading and error states.** Don't ignore a hook's `loading` or `error`; an empty calendar after a failed request looks like "no events".
- **Use GoA components for chrome** such as buttons and inputs (`@abgov/react-components`), so look, focus and keyboard behaviour match the design system.
- **Only set options that take effect.** Don't pass third-party options that need a plugin or handler you haven't added (for example FullCalendar's `editable` without the interaction plugin).

## Data hook rules

Use `src/lib/calendar/useCalendarEvents.tsx` as the reference.

- **Inputs and result:** take the client interface, identifiers and inputs as arguments. Return the data with `loading` and `error`.
- **Stable inputs:** document that callers must create the client once or memoize it. In effect dependencies, use primitive values (`range.start?.getTime()`), not object identity.
- **Ignore stale responses:** only apply a response if its inputs are still current (the `current` flag pattern). Don't fetch until the inputs are ready.
- **No business rules:** display what core's client returns. Don't re-implement rules the service already applies, such as recurrence expansion.
- **Dates:** use the Alberta values core provides (for example `CalendarHoliday.day`). Never hard-code a UTC offset, and don't parse date-only strings with `new Date()`, which reads them as UTC midnight.

## Third-party UI libraries

- **Wrap, don't expose.** The library's types and components never appear in public props or exports.
- **CSS:** import the library's own CSS in the component, and declare the module in `css.d.ts`. ADSP styling for the library lives in core's `adsp-<component>.css`, which maps the library's variables to `--adsp-*` tokens.
- **Global side effects** such as polyfills (`temporal-polyfill/global`) or global CSS are a deliberate decision: note them in the README and keep `sideEffects` in `package.json` accurate.
- **Dependencies:** packages the app also installs (`react`, `@abgov/react-components`) belong in `peerDependencies`, so the app doesn't get two copies. Add any new package to this library's `package.json` (the `@nx/dependency-checks` lint rule fails otherwise) and to the root `package.json`, and check `npx nx build adsp-components-react` doesn't bundle it.
- **ESM-only packages** must be allowed in `transformIgnorePatterns`, in this library's `jest.config.ts` and in `apps/sandbox-app/jest.config.ts`.
- **Library DOM:** if core's CSS relies on the library's DOM structure, pin the library version here and say why.

## Public API and breaking changes

- **Breaking:** removing or renaming an export, prop or hook result field, changing a prop's type, or changing default behaviour. Add a `BREAKING CHANGE:` footer, and update the README API tables and the sandbox examples in the same PR.
- **Non-breaking:** adding optional props, exports or result fields.
- **Commit scope** is the project name: `feat(adsp-components-react): …`. When core changes too, list both scopes.
- The package isn't published yet (no `release` target), but `sandbox-app` uses it from source, so breaking changes surface immediately.

## Tests

Follow the [unit testing standards](../../architecture/unit-testing-standards.md) and the React section of the [clean code rules](../../architecture/clean-code-rules.md): co-located specs, Arrange/Act/Assert, descriptive names, no logic in tests.

- **Tools:** Jest with Testing Library (`render`, `renderHook`, `screen`, `waitFor`). Query by role, text or `testId`, never by a third-party library's generated class names.
- **Fake clients** implement the core interface with `jest.fn()`. Shape responses like the real service's, and make fakes honour their inputs (for example return only events in the requested range), so tests catch range and default bugs.
- **GoA buttons** listen for the web component's `_click` event, not a DOM click: `fireEvent(element, new CustomEvent('_click'))`.
- **Theming:** assert the root element's `--adsp-*` style properties for the theme, provider overrides and `themeOverrides`.

## Before you finish

```bash
npx nx test adsp-components-react
npx nx lint adsp-components-react
npx nx build adsp-components-react
npx nx test adsp-components-core   # when core changed too
npx nx test sandbox-app            # the examples render the components
```

- [ ] Tokens, CSS, shared types and data logic are in core, not here
- [ ] The root element has the `adsp-<component>` class, the theme style and `testId`
- [ ] No `className` or `style` props; `themeOverrides` is typed from core
- [ ] No third-party library types in public props or exports
- [ ] Default first render, loading and error states are handled and tested
- [ ] New packages are in both `package.json` files, peers where the app also installs them, and ESM-only ones are in Jest's `transformIgnorePatterns`
- [ ] Exported from `src/index.ts`, README API tables updated, sandbox example added
- [ ] Breaking changes marked with `BREAKING CHANGE:`

## References

- [README.md](./README.md): using the library, customizing, API
- [Core AGENTS.md](../adsp-components-core/AGENTS.md) and [core README](../adsp-components-core/README.md): tokens, CSS and service clients
- [Sandbox adsp-components README](../../apps/sandbox-app/src/app/components/services/adsp-components/README.md): the example app
- [Unit testing standards](../../architecture/unit-testing-standards.md) and [clean code rules](../../architecture/clean-code-rules.md)
- [Root AGENTS.md](../../AGENTS.md): repo-wide conventions and Nx commands
