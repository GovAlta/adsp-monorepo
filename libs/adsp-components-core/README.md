# adsp-components-core

The framework-independent foundation for the ADSP application components. This library holds the
contracts and values that are the same no matter what renders them, so a React, Angular or Vue
adapter can share one definition instead of each maintaining its own.

**Nothing here may import React, Angular, Vue, or any other UI framework.** Framework-specific
infrastructure — context, providers, hooks — belongs in the corresponding adapter. For React that is
[`adsp-components-react`](../adsp-components-react/README.md), which is also where you should look
for how an application actually uses any of this.

Today the library contains the theme contract. Component cores are added beside it as components are
built.

## What a theme is

An `AdspTheme` is the presentation policy for the whole ADSP component family — the semantic
decisions that keep components visually consistent and inside GoA Design System guidelines. It is
deliberately not a free-form style object: applications **select** a theme from `AdspThemes` rather
than assembling their own.

A theme controls colour, typography, spacing, surfaces and component-specific rendering. It must
never control behaviour — ordering, scrolling, permissions, data loading, or service calls are not
presentation decisions and do not belong in a theme.

## The `AdspTheme` contract

```ts
interface AdspTheme {
  name: string;
  color: AdspThemeColor;
  typography: AdspThemeTypography;
  spacing: AdspThemeSpacing;
  borderRadius: AdspThemeBorderRadius;
  components: Record<string, unknown>;
}
```

| Section        | Shape                                          | Purpose                                         |
| -------------- | ---------------------------------------------- | ----------------------------------------------- |
| `color`        | `text` / `surface` / `interactive` / `status`  | Semantic colour roles, not a palette.           |
| `typography`   | `fontFamily`, plus `heading` and `body` scales | Each scale entry is `{ fontSize, lineHeight }`. |
| `spacing`      | `3xs` `2xs` `xs` `s` `m` `l` `xl` `2xl` `3xl`  | The GoA spacing scale.                          |
| `borderRadius` | `none` `s` `m` `l` `round`                     | Corner treatments.                              |
| `components`   | `Record<string, unknown>`                      | Extension point — see below.                    |

The colour roles in full:

```ts
color.text; // default, secondary, light, disabled
color.surface; // page, card, input, default
color.interactive; // default, hover, focus, disabled
color.status; // success, info, important, emergency
```

Typography scales run `xs → xl` for headings and `xs → l` for body, each entry being an
`AdspThemeTypeStyle` of `{ fontSize, lineHeight }`.

## `AdspThemes.standard`

The default theme, and currently the only one. Its values are **references to GoA design token
custom properties**, not literal colours or sizes:

```ts
AdspThemes.standard.color.surface.card; // 'var(--goa-color-surface-card)'
AdspThemes.standard.spacing.m; // 'var(--goa-space-m)'
```

Referencing tokens means the theme tracks the design system rather than forking it. It also means
the consuming application must load the token stylesheets — see below.

One detail worth knowing if you extend the theme: type sizes reference the **font size scale**
(`--goa-font-size-4`), not the `--goa-typography-*` tokens. Those are CSS `font` _shorthands_
(`weight size/line-height family`), so using one as a `font-size` produces a declaration the browser
discards and the text silently falls back to its inherited size.

## Design token requirement

The consuming application must load both stylesheets:

```ts
import '@abgov/web-components/index.css';
import '@abgov/design-tokens/dist/tokens.css';
```

Both are required. `@abgov/web-components/index.css` defines most `--goa-*` properties at `:root`,
but not all — the surface colours (`--goa-color-surface-page`, `-card`, `-input`, `-default`),
`--goa-color-important-default` and `--goa-border-radius-round` come from `@abgov/design-tokens`.

**Omitting the tokens stylesheet produces no error.** The custom properties are undefined, the
declarations built from them are dropped, and components render unstyled. If something looks
unthemed, check these two imports first.

## Component-specific theme sections

`components` is the extension point for presentation that the common semantic tokens cannot express
— a conversation component's message renderer, for example. It is intentionally untyped and empty
until a real component needs it.

When a component does need one, it adds its own typed section under `components` rather than
widening the common contract, and only for a demonstrated requirement. Do not add speculative
properties, and do not give a component a parallel styling prop as an alternative route — if
presentation is governed by the theme, the theme is the supported extension point.

## Layout

One folder per concern under `src/lib`, so component cores added later sit beside the theme rather
than flattening into one directory:

```
src/
  index.ts        public API barrel
  lib/theme/      AdspTheme, AdspThemes
```

## Adding to the core

Put anything in this library that a second UI framework would otherwise have to reimplement —
domain types, service calls, pagination, normalization, permission resolution. Keep rendering and
framework lifecycle out.

1. Add `src/lib/<component>/` beside `lib/theme/`.
2. Export the public surface from `src/index.ts`.
3. Colocate tests in `.spec.ts`.
4. If the component needs theme values the common tokens cannot express, add a typed section under
   `AdspTheme.components`.

```bash
npx nx test adsp-components-core
npx nx lint adsp-components-core
```
