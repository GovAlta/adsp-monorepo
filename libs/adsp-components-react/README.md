# adsp-components-react

`@abgov/adsp-components-react` is the React adapter for the ADSP application components. It provides:

- `AdspThemeProvider`, for selecting a theme at application level
- the hooks components use to read the current theme
- the React components themselves

It contains only React-specific code. The theme contract, the themes, the stylesheet and shared types live in [adsp-components-core](../adsp-components-core/README.md), so an Angular or Vue adapter can reuse them.

## Where it fits

```
@abgov/design-tokens  ──▶  @abgov/adsp-components-core  ──▶  @abgov/adsp-components-react  ──▶  your React app
   (GoA values)              (theme, CSS, shared types)         (provider, hooks, components)
```

ADSP components are for product teams that want ready-made, consistently styled building blocks that are aligned with the GoA design system. They sit alongside the GoA components (`@abgov/react-components`) without changing how those look.

## Using it in an application

Install the packages:

```bash
npm install @abgov/adsp-components-react @abgov/adsp-components-core @abgov/design-tokens
```

Then set them up once, at the app entry point:

```tsx
import '@abgov/design-tokens/dist/tokens.css';
import '@abgov/adsp-components-core/adsp-components.css';
import { AdspThemes } from '@abgov/adsp-components-core';
import { AdspThemeProvider } from '@abgov/adsp-components-react';

root.render(
  <AdspThemeProvider theme={AdspThemes.standard}>
    <App />
  </AdspThemeProvider>,
);
```

Then use the components anywhere below the provider. They pick up the theme on their own.

```tsx
import { AdspBadge, AdspButton, AdspCard } from '@abgov/adsp-components-react';

<AdspCard heading="Application review">
  <AdspBadge type="info">In review</AdspBadge>
  <AdspButton onClick={approve}>Approve</AdspButton>
</AdspCard>;
```

Things to know:

- **The provider is optional.** Components with no provider above them get `AdspThemes.standard`.
- **Providers can be nested.** A nested provider without `theme` builds on the theme above it, which is how section overrides work.
- **The provider doesn't affect your own components.** It renders no DOM and sets no global CSS. Only ADSP components read the theme.
- **Both stylesheets are required.** Without them, components render unstyled and nothing reports an error.

## Customizing

The theme can be changed at three levels. Each level builds on the one above it.

```tsx
import { AdspThemes, createAdspTheme } from '@abgov/adsp-components-core';

// 1. Theme level: every ADSP component in the app
const brandTheme = createAdspTheme(AdspThemes.standard, {
  components: { button: { borderRadius: '0' } },
});
<AdspThemeProvider theme={brandTheme}>
  <App />
</AdspThemeProvider>;

// 2. Section level: every ADSP component in this subtree, on top of the theme above it
<AdspThemeProvider overrides={{ components: { button: { primary: { background: 'var(--adsp-color-status-success)' } } } }}>
  <ApprovalPanel />
</AdspThemeProvider>;

// 3. Component level: this instance only
<AdspButton themeOverrides={{ borderRadius: 'var(--adsp-border-radius-round)' }}>Save</AdspButton>;
```

- Overrides accept only the token names defined in core, such as `AdspButtonTheme`, so a typo fails to compile. There is still no `className` or `style` escape hatch.
- Prefer aliasing base roles (`var(--adsp-color-status-success)`) over hard-coded colours, so customizations stay aligned with GoA and follow theme changes.
- Define override objects outside the component, or wrap them in `useMemo`. A new object on every render recomputes the theme each time.

## API

### Theme

| Export                                    | Type                                                               | Purpose                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `AdspThemeProvider`                       | `({ theme?: AdspTheme; overrides?: AdspThemeOverrides; children? })` | Selects `theme`, or builds on the theme above it, and applies `overrides` for its subtree |
| `useAdspTheme()`                          | `() => AdspTheme`                                                  | Current theme object, for logic that needs a theme value                                    |
| `useAdspThemeStyle(component?, overrides?)` | `() => CSSProperties`                                            | Current theme as `--adsp-*` properties, plus that component's instance overrides            |

### Components

These are simple sample components. They show the pattern that every ADSP component follows. Each one accepts `themeOverrides` for its own tokens.

| Component    | Props                                                                                    | Tokens (`themeOverrides`)                                                        |
| ------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `AdspCard`   | `heading: string`, `children?`, `themeOverrides?`, `testId?`                             | `background`, `borderColor`, `borderRadius`, `padding`, `headingColor`           |
| `AdspBadge`  | `type: 'success' \| 'info' \| 'important' \| 'emergency'`, `children`, `themeOverrides?`, `testId?` | `borderRadius`, `textColor`, `statusColor.<type>`                  |
| `AdspButton` | `variant?: 'primary' \| 'secondary'`, `themeOverrides?`, `testId?`, native button attributes | `borderRadius`, and per variant: `background`, `borderColor`, `textColor`, and their `hover*` versions |

`AdspCard` renders a `<section>` with an `<h3>` heading. `AdspButton` defaults to `type="button"` and doesn't accept `className` or `style`.

## Building a component

Every ADSP React component follows the same four rules:

1. **Read the theme from context.** Call `useAdspThemeStyle('<component>', themeOverrides)` and spread it onto the component's root element. The only theme-related prop is a typed `themeOverrides` for the component's own tokens.
2. **Style it with classes from `adsp-components.css` in core.** Don't use inline styles or CSS-in-JS, or the Angular and Vue adapters couldn't share the styles.
3. **Don't offer `className`, `style` or render-override props.** Teams change how a component looks through the theme, provider `overrides` or `themeOverrides`.
4. **Import shared types from core.** Token types and variant types such as `AdspButtonVariant` live in core, so every framework uses the same values.

```tsx
import { type AdspBadgeType, type AdspComponentThemeOverrides } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';

interface AdspBadgeProps {
  type: AdspBadgeType;
  children: ReactNode;
  themeOverrides?: AdspComponentThemeOverrides<'badge'>;
}

export function AdspBadge({ type, children, themeOverrides }: AdspBadgeProps) {
  const themeStyle = useAdspThemeStyle('badge', themeOverrides);

  return (
    <span className={`adsp-badge adsp-badge--${type}`} style={themeStyle}>
      {children}
    </span>
  );
}
```

To add a component:

1. Add its tokens, styles and any shared types to core (see [Adding a component](../adsp-components-core/README.md#adding-a-component)).
2. Add the React component in `src/lib/<component>/adsp-<component>.tsx`, with a colocated `.spec.tsx`.
3. Export it from `src/index.ts`.
4. Add an example to the sandbox app ([adsp-components](../../apps/sandbox-app/src/app/components/services/adsp-components/README.md)).

## Development

```bash
npx nx test adsp-components-react
npx nx lint adsp-components-react
npx nx build adsp-components-react   # also builds core; React and core are not bundled
```

The package isn't published yet. See [adsp-components-core](../adsp-components-core/README.md#development) for the release notes.
