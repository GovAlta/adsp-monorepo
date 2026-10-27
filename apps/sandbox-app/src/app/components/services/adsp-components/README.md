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

| Section               | What to look for                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Theme level        | Switching the radio selects a whole theme; the CSS custom properties list below follows it                                                            |
| 2. Section level      | A nested `AdspThemeProvider` with `overrides` changes part of the theme for its subtree only                                                          |
| 3. Component level    | `themeOverrides` on one component instance                                                                                                            |
| 4. Precedence         | Component beats section, section beats theme. The table shows the calendar event background at each level; switching theme changes only the Theme row |
| No provider           | Components outside a provider use `AdspThemes.standard`                                                                                               |
| Application setup     | The imports and the provider                                                                                                                          |
| CSS custom properties | The exact `--adsp-*` values the selected theme produces                                                                                               |

## Files

| File                          | Purpose                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `AdspThemingExample.tsx`      | The demo page                                                                          |
| `AdspThemingExample.spec.tsx` | Covers theme switching, the precedence table, and that GoA elements are unaffected     |
| `highContrastDemoTheme.ts`    | A theme-level customization built with `createAdspTheme`, used to show theme switching |

The ADSP stylesheet is loaded once, in `src/app/app.tsx`, next to the GoA stylesheets. The landing page that links here is `../AdspComponentsMain.tsx`.

## Adding an example

1. Build the component in the libraries first (see [Building a component](../../../../../../../libs/adsp-components-react/README.md#building-a-component)).
2. Import it from `@abgov/adsp-components-react`, never by relative path, so the example matches real usage.
3. Add it to the showcase in `AdspThemingExample.tsx`, or add a new page:
   - add the page entry in `addAdspComponentsPages` in `src/app/utils/servicePageUtils.ts`
   - add its route in `SandboxTenant.tsx`
