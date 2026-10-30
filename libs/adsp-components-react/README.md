# adsp-components-react

`@abgov/adsp-components-react` is the React adapter for the ADSP application components. It provides:

- `AdspThemeProvider`, for selecting a theme at application level
- the hooks components use to read the current theme
- the React components themselves, currently `AdspGoACalendar`

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
npm install @abgov/adsp-components-react @abgov/adsp-components-core @abgov/design-tokens @abgov/react-components
```

`@abgov/react-components` is a peer dependency: ADSP components use the GoA components your app already has, so there is only one copy.

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
import { useMemo } from 'react';
import { CalendarClient } from '@abgov/adsp-components-core';
import { AdspGoACalendar } from '@abgov/adsp-components-react';

function TeamCalendar({ getAccessToken }: { getAccessToken: () => Promise<string | undefined> }) {
  // Create the client once: a new client on every render reloads the events.
  const client = useMemo(
    () =>
      new CalendarClient({
        serviceUrl: 'https://calendar-service.adsp.alberta.ca',
        tenant: 'my-tenant',
        getAccessToken,
      }),
    [getAccessToken],
  );

  return <AdspGoACalendar client={client} calendar="my-calendar" />;
}
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
  components: { calendar: { eventBackground: 'var(--adsp-color-status-success)' } },
});
<AdspThemeProvider theme={brandTheme}>
  <App />
</AdspThemeProvider>;

// 2. Section level: every ADSP component in this subtree, on top of the theme above it
<AdspThemeProvider overrides={{ components: { calendar: { holidayBackground: 'var(--adsp-color-status-info)' } } }}>
  <SchedulingPanel />
</AdspThemeProvider>;

// 3. Component level: this instance only
<AdspGoACalendar
  client={client}
  calendar="my-calendar"
  themeOverrides={{ borderColor: 'var(--adsp-color-interactive-default)' }}
/>;
```

- Overrides accept only the token names defined in core, such as `AdspCalendarTheme`, so a typo fails to compile. There is still no `className` or `style` escape hatch.
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

#### `AdspGoACalendar`

A calendar built on FullCalendar and styled with GoA tokens. It shows month, week, day and list views, with a toolbar of GoA buttons. It loads events and Alberta statutory holidays for the visible range through the client you pass, and shows holidays as background events on their Alberta day.

| Prop               | Type                                      | Description                                                                                       |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `client`           | `ICalendarClient`                         | Loads events and holidays, usually a `CalendarClient` from core. Create it once or memoize it.    |
| `calendar`         | `string`                                  | Name of the calendar in the Calendar service.                                                     |
| `defaultView`      | `'month' \| 'week' \| 'day' \| 'list'`    | The view it opens in. Defaults to `'month'`.                                                      |
| `initialDateRange` | `DateRange`                               | The range loaded first, and the date the calendar opens on. Defaults to the 365 days up to today. |
| `themeOverrides`   | `AdspComponentThemeOverrides<'calendar'>` | Calendar tokens for this instance only.                                                           |
| `testId`           | `string`                                  | `data-testid` on the root element.                                                                |

| Token (`themeOverrides`)                                       | Styles                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `borderColor`                                                  | Grid and cell borders                                                             |
| `todayBackground`                                              | Today's cell or column                                                            |
| `todayBackgroundColor`, `todayTextColor`, `todayFontWeight`    | The marker around today's date                                                    |
| `eventBackground`, `eventTextColor`                            | Events                                                                            |
| `holidayBackground`                                            | Holidays                                                                          |
| `buttonBackground`, `buttonTextColor`, `buttonHoverBackground` | FullCalendar's own buttons. The toolbar uses GoA buttons, which don't read these. |

Things to know:

- **Recurring events aren't shown yet.** Only one-off events and holidays are displayed.
- **Global side effects.** The component imports FullCalendar's stylesheets and `temporal-polyfill/global`, which adds the `Temporal` API if the browser doesn't have it.

#### `useCalendarEvents(client, calendar, range)`

The hook `AdspGoACalendar` uses to load data. It returns `{ calendarEvents, loading, error }`, reloads when the calendar or range changes, and fetches nothing while `range` is `undefined`. The client must be stable across renders.

## Building a component

Every ADSP React component follows the same four rules:

1. **Read the theme from context.** Call `useAdspThemeStyle('<component>', themeOverrides)` and spread it onto the component's root element. The only theme-related prop is a typed `themeOverrides` for the component's own tokens.
2. **Style it with classes from its stylesheet in core** (`src/lib/<component>/adsp-<component>.css`, imported by `adsp-components.css`). Don't use inline styles or CSS-in-JS, or the Angular and Vue adapters couldn't share the styles.
3. **Don't offer `className`, `style` or render-override props.** Teams change how a component looks through the theme, provider `overrides` or `themeOverrides`.
4. **Import shared types from core.** Token types and shared values such as `AdspCalendarTheme` and `CalendarView` live in core, so every framework uses the same values.

```tsx
import { type AdspComponentThemeOverrides, type CalendarView, type ICalendarClient } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';

interface AdspGoACalendarProps {
  client: ICalendarClient;
  calendar: string;
  defaultView?: CalendarView;
  themeOverrides?: AdspComponentThemeOverrides<'calendar'>;
  testId?: string;
}

export const AdspGoACalendar = ({
  client,
  calendar,
  defaultView = 'month',
  themeOverrides,
  testId,
}: AdspGoACalendarProps) => {
  const themeStyle = useAdspThemeStyle('calendar', themeOverrides);

  // Load data with useCalendarEvents(client, calendar, range) and render FullCalendar inside the root element.
  return (
    <div className="adsp-calendar" style={themeStyle} data-testid={testId}>
      …
    </div>
  );
};
```

See `src/lib/calendar/adsp-goa-calendar.tsx` for the full component, and [AGENTS.md](./AGENTS.md) for where files go and the rules reviewers check.

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
