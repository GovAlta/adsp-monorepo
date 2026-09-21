# adsp-components-core

Framework-independent foundation for the ADSP application components: the `AdspTheme` contract and
the themes ADSP supplies.

This library must not depend on React, Angular, Vue or any other UI framework. Framework-specific
theme infrastructure (context, providers, hooks) belongs in the corresponding adapter package - for
React, `adsp-components-react`.

## Structure

Each concern gets its own folder under `src/lib`, so components added later sit beside the theme
rather than flattening into one directory:

```
src/lib/
  theme/        AdspTheme, AdspThemes and their tests
```

## Design token requirement

`AdspThemes.standard` does not hold literal colour and size values. Every value is a reference to a
GoA Design System custom property, for example:

```ts
AdspThemes.standard.color.surface.card; // 'var(--goa-color-surface-card)'
```

So the theme tracks the design system rather than forking it - but it also means **a consuming
application must load the GoA design tokens stylesheet**:

```ts
import '@abgov/web-components/index.css';
import '@abgov/design-tokens/dist/tokens.css';
```

Both imports are required. `@abgov/web-components/index.css` defines most of the `--goa-*` custom
properties at `:root`, but not all of them - the surface colours (`--goa-color-surface-page`,
`--goa-color-surface-card`, `--goa-color-surface-input`, `--goa-color-surface-default`),
`--goa-color-important-default` and `--goa-border-radius-round` come from `@abgov/design-tokens`.

An application that omits the tokens stylesheet gets **no error**. The custom properties are simply
undefined, the declarations built from them are dropped, and themed components render unstyled. If
components look unthemed, check these imports first.

## Usage

```ts
import { AdspTheme, AdspThemes } from '@core-services/adsp-components-core';

const theme: AdspTheme = AdspThemes.standard;
```

Applications select from `AdspThemes`; they are not expected to assemble their own `AdspTheme`.

## Adding component-specific theme properties

`AdspTheme.components` is the extension point for presentation that cannot be expressed through the
common semantic tokens (colour, typography, spacing, border radius). It is intentionally untyped and
empty. A component ticket that needs its own theme section adds the typed section there rather than
widening the common contract.

## Testing

```bash
npx nx test adsp-components-core
npx nx lint adsp-components-core
```
