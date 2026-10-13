# adsp-components-core

`@abgov/adsp-components-core` is the framework-independent foundation of the ADSP application components. It holds everything that is the same no matter which UI framework renders a component:

- the `AdspTheme` contract and the themes applications select from (`AdspThemes`)
- component tokens for each component, such as `AdspButtonTheme` and `AdspCardTheme`
- `createAdspTheme()`, which derives a customized theme from an existing one
- `toCssVariables()` and `toComponentCssVariables()`, which turn a theme or a component's overrides into `--adsp-*` CSS custom properties
- `adsp-components.css`, the stylesheet for every ADSP component
- shared types such as `AdspBadgeType` and `AdspButtonVariant`

It contains no React, Angular or Vue code. Lint fails if a file here imports one of them.

## The big picture

```
@abgov/design-tokens                GoA owns the values: --goa-* custom properties (light and dark)
        │  referenced by
        ▼
@abgov/adsp-components-core         ADSP owns the semantics: theme contract, themes, CSS bridge, stylesheet
        │  used by
        ├──▶ @abgov/adsp-components-react      provider, hooks and React components (exists)
        ├──▶ @abgov/adsp-components-angular    same idea for Angular (future)
        └──▶ @abgov/adsp-components-vue        same idea for Vue (future)
                │  used by
                ▼
        Product team applications
```

How a value reaches the screen:

```
AdspThemes.standard.color.surface.card           = 'var(--goa-color-surface-card)'     base role
AdspThemes.standard.components.card.background   = 'var(--adsp-color-surface-card)'    component token
        │ toCssVariables(theme)
        ▼
--adsp-color-surface-card: var(--goa-color-surface-card)
--adsp-components-card-background: var(--adsp-color-surface-card)   both set on each ADSP component's root
        │ adsp-components.css
        ▼
.adsp-card { background: var(--adsp-components-card-background); }
```

Because components read the theme only through `--adsp-*` properties, one stylesheet works in every framework. Each framework adapter only has to:

1. let the application select a theme
2. set `toCssVariables(theme)` on each component's root element

## Using it in an application

Applications don't use this package on its own. They install it with a framework adapter and load two stylesheets once, at the app entry point:

```ts
import '@abgov/design-tokens/dist/tokens.css'; // GoA values the themes reference
import '@abgov/adsp-components-core/adsp-components.css'; // ADSP component styles
```

If either import is missing, nothing errors: the components simply render unstyled. For theme selection and the components themselves, see [adsp-components-react](../adsp-components-react/README.md).

## The theme contract

An `AdspTheme` is presentation policy for the whole ADSP component family. A theme controls colour, typography, spacing and corner radius. It never controls behaviour such as data loading, permissions or ordering.

| Section        | Contents                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `color`        | Roles, not a palette: `text`, `surface`, `border`, `interactive`, `status`                        |
| `typography`   | `fontFamily`, plus `heading` (`2xs`–`2xl`) and `body` (`xs`–`l`) scales of `{ fontSize, fontWeight, lineHeight }` |
| `spacing`      | The GoA spacing scale, `none`–`4xl`                                                               |
| `borderRadius` | The GoA radius scale, `none`–`3xl` and `round`                                                    |
| `components`   | Component tokens, one section per component: `badge`, `button`, `card`                            |

There are two layers:

- **Base roles** (`color`, `typography`, `spacing`, `borderRadius`) reference GoA tokens.
- **Component tokens** (`components.*`) default to aliases of the base roles, for example `components.card.background = 'var(--adsp-color-surface-card)'`. Changing a base role restyles every component that uses it, unless a component token is overridden.

## Customizing: three levels

Teams can change the theme at three levels. Each level builds on the one above it.

| Level     | What it changes                                 | How                                                                  |
| --------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| Theme     | Every ADSP component in the app                 | `createAdspTheme(AdspThemes.standard, overrides)`, then select it    |
| Section   | Every ADSP component in one part of the page    | A nested provider with `overrides` (see the framework adapter)       |
| Component | One component instance                         | The component's `themeOverrides` input (see the framework adapter)   |

```ts
import { AdspThemes, createAdspTheme } from '@abgov/adsp-components-core';

export const brandTheme = createAdspTheme(AdspThemes.standard, {
  name: 'brand',
  components: { button: { borderRadius: '0', primary: { background: 'var(--adsp-color-status-success)' } } },
});
```

`createAdspTheme` deep-merges the overrides over the base theme and returns a new frozen theme. The base theme is never changed, and anything not overridden is kept.

Overrides are limited to the token names the types define, so a typo fails to compile. The values, however, can be any CSS value. To stay aligned with GoA, alias base roles (`var(--adsp-color-status-success)`) rather than hard-coding colours.

## `AdspThemes.standard`

This is the default theme and currently the only one. Every base role is a reference to a GoA design token (`var(--goa-*)`), never a literal value, and every component token aliases a base role. As a result:

- the theme tracks the GoA design system instead of forking it
- GoA's dark theme (`:root[data-theme="dark"]`) applies automatically
- specs check that every referenced GoA token exists in `@abgov/design-tokens`, and that every component token aliases a property the theme defines. A token rename in a GoA upgrade fails the build instead of silently unstyling components.

The typography values reference the `--goa-font-size-*`, `--goa-font-weight-*` and `--goa-line-height-*` scales. They don't use `--goa-typography-*`: those tokens are `font` shorthands, which are invalid as individual property values.

The themes are frozen. Any attempt to modify one throws.

## `toCssVariables(theme)`

This function flattens a theme into custom properties, converting each path to kebab-case:

| Theme path                             | Custom property                              |
| -------------------------------------- | -------------------------------------------- |
| `color.surface.card`                   | `--adsp-color-surface-card`                  |
| `typography.heading.s.fontSize`        | `--adsp-typography-heading-s-font-size`      |
| `borderRadius.round`                   | `--adsp-border-radius-round`                 |
| `components.button.primary.background` | `--adsp-components-button-primary-background` |

The result is cached per theme object. Treat these property names as public API: renaming one breaks every stylesheet that reads it.

`toComponentCssVariables(component, overrides)` uses the same naming for one component's instance overrides. For example, `('button', { borderRadius: '0' })` gives `--adsp-components-button-border-radius: 0`. Framework adapters set the result on that instance's root element, after the theme's own properties.

## Adding a component

1. Create `src/lib/components/<component>.ts` containing:
   - its token interface, for example `AdspCardTheme`
   - its default tokens, each aliasing a base role (`var(--adsp-*)`), never a `--goa-*` token
   - any variant types that map to CSS modifier classes
2. Add the section to `AdspThemeComponents` in `src/lib/theme/adsp-theme.ts`, and the defaults to `AdspThemes.standard`. The compiler enforces that every theme supplies it.
3. Export its types from `src/index.ts`.
4. Add its styles to `src/adsp-components.css`:
   - Prefix class names with `adsp-` and use BEM naming (for example `adsp-card__heading`).
   - Read `--adsp-components-<component>-*` for anything teams may customize, and base `--adsp-*` roles for the rest. Never read `--goa-*`, which would bypass the selected theme.
   - Set explicit values such as `margin` and `list-style`, so an application's global CSS doesn't leak in.
5. Build the framework part in each adapter (see [adsp-components-react](../adsp-components-react/README.md#building-a-component)).

## Scope and isolation

The theme only affects ADSP components:

- The theme variables are set on each ADSP component's root element, not on `:root`.
- Class names are prefixed with `adsp-`.

Isolation only works one way. An application's global CSS, such as a rule on `* { font-family }`, can still reach into ADSP components. Fully blocking that would need Shadow DOM.

## Development

```bash
npx nx test adsp-components-core
npx nx lint adsp-components-core
npx nx build adsp-components-core   # dist/libs/adsp-components-core, includes adsp-components.css
```

The package isn't published yet: there is no `release` target. Adding one publishes to npm automatically when the change merges to `main` (`nx affected --target=release` in Delivery CI). See `libs/jsonforms-components` for the release setup to copy.
