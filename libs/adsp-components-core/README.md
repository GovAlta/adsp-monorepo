# ADSP Application Components

Reusable UI components that ADSP provides to Alberta government product teams, styled so they
match the GoA Design System and stay consistent across every application that embeds them.

The framework is two libraries:

| Library                                | What lives there                                                                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `@core-services/adsp-components-core`  | Framework-independent contracts and values — the `AdspTheme` contract and the `AdspThemes` an application picks from. No React, Angular or Vue. |
| `@core-services/adsp-components-react` | The React adapter — `AdspThemeProvider`, `useAdspTheme()`, and the React components themselves.                                                 |

Anything that does not need a UI framework goes in core, so a future Angular or Vue adapter can
reuse it. Anything that touches React goes in the React library.

## Consuming it in an application

```tsx
import '@abgov/web-components/index.css';
import '@abgov/design-tokens/dist/tokens.css'; // required — see below
import { AdspThemes } from '@core-services/adsp-components-core';
import { AdspThemeProvider } from '@core-services/adsp-components-react';

export const App = () => (
  <AdspThemeProvider theme={AdspThemes.standard}>
    <YourApplication />
  </AdspThemeProvider>
);
```

That is the whole integration. Every ADSP component rendered below the provider picks up the theme
on its own — you never pass a theme to an individual component.

Two things to know:

- **The provider is optional.** A component with no `AdspThemeProvider` above it uses
  `AdspThemes.standard`, so an application that does not care about theming can skip it entirely.
- **Both stylesheets are required.** Theme values are references to GoA custom properties
  (`var(--goa-color-surface-card)`), not literal colours. Miss the `@abgov/design-tokens` import and
  there is **no error** — the properties are undefined and components render unstyled.
  `@abgov/web-components/index.css` alone is not enough; it does not define the surface colours,
  `--goa-color-important-default` or `--goa-border-radius-round`. If components look unthemed, check
  these two imports first.

## Layout

One folder per concern, in both libraries:

```
libs/adsp-components-core/src/
  index.ts                     public API barrel
  lib/theme/                   AdspTheme, AdspThemes

libs/adsp-components-react/src/
  index.ts                     public API barrel
  lib/theme/                   AdspThemeProvider, useAdspTheme
```

A new component adds `lib/<component>/` beside `lib/theme/` rather than flattening files into
`lib/`.

## Adding a component

1. **Split it.** Types, validation and any logic that does not need React go in
   `adsp-components-core/src/lib/<component>/`. The React component goes in
   `adsp-components-react/src/lib/<component>/`.
2. **Read the theme from context**, never from a prop:

   ```tsx
   import { useAdspTheme } from '@core-services/adsp-components-react';

   export const YourComponent = () => {
     const theme = useAdspTheme();
     return <div style={{ background: theme.color.surface.card, padding: theme.spacing.m }}>...</div>;
   };
   ```

3. **Prefer the shared tokens** — `color`, `typography`, `spacing`, `borderRadius` — so components
   stay visually consistent. Only when a component needs presentation those cannot express does it
   add a typed section under `AdspTheme.components`, which exists for exactly that purpose and is
   empty until something needs it. Do not add speculative properties.
4. **Export it** from the library's `src/index.ts`.
5. **Test it** in a colocated `.spec.ts(x)` file.
6. **Show it** by adding a sample page to `sandbox-app` — see
   `apps/sandbox-app/docs/HOW-TO-CREATE-SANDBOX-EXAMPLES_README.md`.

## Working example

`sandbox-app` renders the same component under three theme selections at
**Services → ADSP components → ADSP theme provider**
(`apps/sandbox-app/src/app/components/services/adsp-components/AdspThemeExampleOne.tsx`).

```bash
npx nx test adsp-components-core
npx nx test adsp-components-react
npx nx serve sandbox-app
```
