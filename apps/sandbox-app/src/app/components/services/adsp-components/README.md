# ADSP components sandbox examples

This folder holds the sandbox demo for the ADSP application components and their theming. It is a **consumer** of the component libraries. It uses them exactly the way a product team's app would, so nothing here is reusable library code.

## Where it fits

```
libs/adsp-components-core    theme, stylesheet, shared types    ─┐
libs/adsp-components-react   provider, hooks, components         ─┤
                                                                   ▼
apps/sandbox-app/.../adsp-components    this folder: a team-style app using them
```

Components are built and tested in the libraries. This folder only shows them in use, so reviewers and other teams can see the result in a running app.

- [adsp-components-core](../../../../../../../libs/adsp-components-core/README.md)
- [adsp-components-react](../../../../../../../libs/adsp-components-react/README.md)

## Running it

```bash
npx nx serve sandbox-app
```

Sign in, then open **Services → ADSP components → Theming**, or go to `/<tenant>/services/adsp-components/theming`.

## What the page shows

| Section                                | What to look for                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1. Theme level                         | Switching the radio restyles every ADSP component inside `AdspThemeProvider`                      |
| 2. Section level                       | A nested provider with `overrides` turns primary buttons green in that section only. It still follows the selected theme |
| 3. Component level                     | `themeOverrides` gives one card a highlight and one button pill-shaped corners. The buttons next to it stay unchanged |
| No provider                            | The last card stays on `AdspThemes.standard`, the default when there is no provider                |
| GoA components on the page             | The container, text and radios don't change: the theme only reaches ADSP components                |
| Buttons                                | Hover, focus and disabled states come from the stylesheet, which inline styles couldn't do          |
| Application setup, Customization levels | The imports, the provider, and a snippet for each customization level                            |
| CSS custom properties                  | The exact `--adsp-*` values the selected theme produces                                            |

## Files

| File                          | Purpose                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `AdspThemingExample.tsx`      | The demo page                                                                                     |
| `AdspThemingExample.spec.tsx` | Covers all three customization levels, the default with no provider, and that GoA elements are unaffected |
| `highContrastDemoTheme.ts`    | A theme-level customization built with `createAdspTheme`, used to show theme switching            |

The ADSP stylesheet is loaded once, in `src/app/app.tsx`, next to the GoA stylesheets. The landing page that links here is `../AdspComponentsMain.tsx`.

## Adding an example

1. Build the component in the libraries first (see [Building a component](../../../../../../../libs/adsp-components-react/README.md#building-a-component)).
2. Import it from `@abgov/adsp-components-react`, never by relative path, so the example matches real usage.
3. Add it to the showcase in `AdspThemingExample.tsx`, or add a new page:
   - add the page entry in `addAdspComponentsPages` in `src/app/utils/servicePageUtils.ts`
   - add its route in `SandboxTenant.tsx`
