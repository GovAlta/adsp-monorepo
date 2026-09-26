# adsp-components-react

The React adapter for the ADSP application components. It provides the React components themselves
and the mechanism they use to obtain the current theme.

The framework-independent contracts and values live in
[`adsp-components-core`](../adsp-components-core/README.md) — the `AdspTheme` contract, the
`AdspThemes` an application picks from, and (as components are built) their framework-independent
cores. Anything that touches React belongs here; anything that does not belongs there, so an Angular
or Vue adapter can reuse it.

## Using it in an application

```tsx
import '@abgov/web-components/index.css';
import '@abgov/design-tokens/dist/tokens.css'; // required — see the core README
import { AdspThemes } from '@core-services/adsp-components-core';
import { AdspThemeProvider } from '@core-services/adsp-components-react';

export const App = () => (
  <AdspThemeProvider theme={AdspThemes.standard}>
    <YourApplication />
  </AdspThemeProvider>
);
```

That is the whole integration. Mount the provider once, at application level. Every ADSP component
below it picks up the theme on its own — you never pass a theme to an individual component.

Two things to know:

- **The provider is optional.** A component with no `AdspThemeProvider` above it gets
  `AdspThemes.standard`, so an application that does not care about theming can skip it entirely.
  Mounting the provider without a `theme` prop does the same.
- **Both stylesheets are required.** Theme values are references to GoA custom properties, not
  literal colours. Miss the `@abgov/design-tokens` import and there is no error — components simply
  render unstyled. The core README covers this in full.

## API

| Export              | Type                                         | Purpose                                                   |
| ------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `AdspThemeProvider` | `React.FC<{ theme?: AdspTheme; children? }>` | Establishes the theme for everything rendered beneath it. |
| `useAdspTheme()`    | `() => AdspTheme`                            | Returns the current theme. Defaults to the standard one.  |

## Building a component

Read the theme from context. Never accept it as a prop, and never add a styling or renderer prop as
an alternative route — the theme is the supported extension point for presentation.

```tsx
import { useAdspTheme } from '@core-services/adsp-components-react';

export const YourComponent = () => {
  const theme = useAdspTheme();

  return (
    <div
      style={{
        background: theme.color.surface.card,
        color: theme.color.text.default,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.l,
      }}
    >
      ...
    </div>
  );
};
```

This works at any depth — a component nested several levels below the provider calls
`useAdspTheme()` itself rather than having the theme threaded down to it.

Prefer the shared semantic tokens (`color`, `typography`, `spacing`, `borderRadius`) so components
stay consistent with one another. Only when a component needs presentation those cannot express does
it add a typed section under `AdspTheme.components`, which is defined in the core.

Keep framework-independent work — service calls, pagination, normalization, permission resolution —
in `adsp-components-core` rather than here, so other framework adapters can reuse it.

1. Add `src/lib/<component>/` beside `lib/theme/`.
2. Export it from `src/index.ts`.
3. Colocate tests in `.spec.tsx`.
4. Add a sample page to `sandbox-app` — see
   `apps/sandbox-app/docs/HOW-TO-CREATE-SANDBOX-EXAMPLES_README.md`.

## Working example

`sandbox-app` renders the same component under three theme selections — no provider, explicit
standard, and a different theme — at **Services → ADSP components → ADSP theme provider**
(`apps/sandbox-app/src/app/components/services/adsp-components/AdspThemeExampleOne.tsx`).

```bash
npx nx test adsp-components-react
npx nx lint adsp-components-react
npx nx serve sandbox-app
```
