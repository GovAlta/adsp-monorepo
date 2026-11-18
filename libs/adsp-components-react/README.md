# adsp-components-react

`@abgov/adsp-components-react` is the React adapter for the ADSP application components. It provides:

- `AdspThemeProvider`, for selecting a theme at application level
- the hooks components use to read the current theme
- the React components themselves: `ADSPCalendar`, `ADSPConversation`, `ADSPFileDownload` and `ADSPFileUpload`

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
import { ADSPCalendar } from '@abgov/adsp-components-react';

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

  return <ADSPCalendar client={client} calendar="my-calendar" />;
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
<ADSPCalendar
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

| Export                                      | Type                                                                 | Purpose                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `AdspThemeProvider`                         | `({ theme?: AdspTheme; overrides?: AdspThemeOverrides; children? })` | Selects `theme`, or builds on the theme above it, and applies `overrides` for its subtree |
| `useAdspTheme()`                            | `() => AdspTheme`                                                    | Current theme object, for logic that needs a theme value                                  |
| `useAdspThemeStyle(component?, overrides?)` | `() => CSSProperties`                                                | Current theme as `--adsp-*` properties, plus that component's instance overrides          |

### Components

#### `ADSPCalendar`

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

The hook `ADSPCalendar` uses to load data. It returns `{ calendarEvents, loading, error }`, reloads when the calendar or range changes, and fetches nothing while `range` is `undefined`. The client must be stable across renders.

#### `ADSPFileDownload`

Downloads a File service file. With only `client` and `fileId`, it shows the filename and size from File service as a tertiary download button. It shows progress while downloading and explains a missing file, a permission failure, an infected file or a pending virus scan, with **Try again** where trying again can help.

```tsx
import { useMemo } from 'react';
import { FileClient } from '@abgov/adsp-components-core';
import { ADSPFileDownload } from '@abgov/adsp-components-react';

// Create the client once or memoize it: a new client on every render reloads the file.
const client = useMemo(() => new FileClient({ serviceUrl, getAccessToken }), [serviceUrl]);

<ADSPFileDownload client={client} fileId={file.id} />;

<ADSPFileDownload client={client} fileId={file.id}>
  <GoabButton type="secondary">Download</GoabButton>
</ADSPFileDownload>;
```

| Prop             | Type                                          | Description                                                                                                                                                                                                                                                                                     |
| ---------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client`         | `IFileClient`                                 | Loads and downloads the file, usually a `FileClient` from core built with the app's `getAccessToken`. Create it once or memoize it.                                                                                                                                                             |
| `fileId`         | `string`                                      | ID of the File service file.                                                                                                                                                                                                                                                                    |
| `canDownload`    | `boolean`                                     | Whether the application lets the current user download. `false` renders nothing and sends no request. Defaults to `true`; File service still authorizes the download.                                                                                                                           |
| `children`       | `ReactElement`                                | A trigger to use in place of the default control, such as a `GoabButton` or a link. The component sets its `onClick`, and `disabled` while downloading (`aria-disabled` on a link, which can't be disabled). Metadata isn't loaded up front, so a list of files doesn't send a request per row. |
| `themeOverrides` | `AdspComponentThemeOverrides<'fileDownload'>` | File download tokens for this instance only.                                                                                                                                                                                                                                                    |
| `testId`         | `string`                                      | `data-testid` on the root element.                                                                                                                                                                                                                                                              |

| Token (`themeOverrides`) | Styles                             |
| ------------------------ | ---------------------------------- |
| `metadataTextColor`      | The file size next to the filename |
| `statusTextColor`        | Loading and downloading messages   |
| `errorTextColor`         | Error messages                     |

Things to know:

- **Permissions.** There is no shared ADSP permission resolver yet, so the application passes `canDownload`. With the default control, File service's answer to the metadata request also tells the component before any click whether the user may download: a 403 shows a permission message instead of the button.
- **The file is held in memory** as a `Blob` before the browser saves it, because a plain link can't send the user's token. See the [core File client README](../adsp-components-core/src/lib/file/README.md).
- **Pending scans aren't bypassed.** The component never sends `unsafe=true`.
- **Changing `fileId` mid-download** doesn't cancel it: the file the user clicked is still saved, but its progress and any error belong to that file, so the new one can be downloaded straight away.
- **Focus after Try again** moves to the control when the retry succeeds, or back to the error when it fails again, because the Try again button removes itself.

#### `useFileDownload(client, fileId, { loadMetadata })`

The hook `ADSPFileDownload` uses. It returns `{ file, loading, downloading, ready, error, download, retry }`. `retry` repeats whatever failed: the metadata load or the download. With `loadMetadata: false` it requests nothing until `download()` is called. Use it to build a different download experience on the same File service behaviour.

#### `ADSPFileUpload`

Uploads files to a File service File Type. With only `client` and `fileTypeId`, it loads the File Type, then shows the GoA drag-and-drop area, which also opens the browser's file picker. It shows the file and its progress while uploading, confirms the upload, and explains a missing File Type, a permission failure or a rejected file, with **Try again** where trying again can help.

```tsx
import { useMemo } from 'react';
import { FileClient } from '@abgov/adsp-components-core';
import { ADSPFileUpload } from '@abgov/adsp-components-react';

// Create the client once or memoize it: a new client on every render reloads the File Type.
const client = useMemo(() => new FileClient({ serviceUrl, getAccessToken }), [serviceUrl]);

<ADSPFileUpload client={client} fileTypeId="my-file-type" />;

<ADSPFileUpload client={client} fileTypeId="my-file-type" recordId={application.id} onUpload={addFile} />;
```

| Prop             | Type                                        | Description                                                                                                                                                        |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `client`         | `IFileUploadClient`                         | Loads the File Type and uploads files, usually a `FileClient` from core built with the app's `getAccessToken`. Create it once or memoize it.                       |
| `fileTypeId`     | `string`                                    | ID of the File service File Type the files are uploaded as.                                                                                                        |
| `canUpload`      | `boolean`                                   | Whether the application lets the current user upload. `false` renders nothing and sends no request. Defaults to `true`; File service still authorizes the upload.  |
| `recordId`       | `string`                                    | Ties each uploaded file to a record in the application, such as a form submission.                                                                                 |
| `onUpload`       | `(file: FileMetadata) => void`              | Called with the file as File service stored it, once for each upload that succeeds.                                                                                |
| `themeOverrides` | `AdspComponentThemeOverrides<'fileUpload'>` | File upload tokens for this instance only.                                                                                                                         |
| `testId`         | `string`                                    | `data-testid` on the root element; the GoA input gets `-input`, and each upload's card, confirmation and retry button get `-card-N`, `-uploaded-N` and `-retry-N`. |

| Token (`themeOverrides`) | Styles                         |
| ------------------------ | ------------------------------ |
| `guidanceTextColor`      | Guidance text                  |
| `statusTextColor`        | Loading and uploading messages |
| `successTextColor`       | The upload confirmation        |
| `errorTextColor`         | Error messages                 |

Things to know:

- **Permissions.** There is no shared ADSP permission resolver yet, so the application passes `canUpload`. File service's answer to the File Type request also tells the component before any upload whether the user may use the type: a 403 shows a permission message instead of the drop area.
- **Allowed formats.** When the File Type lists `allowedFileTypes`, the component shows them under the drop area and fails a file with another extension at once, without sending it and without offering Try again. File service still checks the content and its answer is authoritative; its own format rejection gets the same message. The component also applies File service's 3 GB upload limit (the GoA input would otherwise reject anything over 5 MB).
- **Several files.** Every file dropped or picked is uploaded, each with its own card, and the drop area stays available for more.
- **Progress** stops at 99% until File service answers, because File service only accepts or rejects the file once it has received all of it.
- **Cancel** stops an upload in progress, and on a failed upload it dismisses the error. A finished upload shows a confirmation with no Remove button, because the component doesn't delete files from File service.
- **Changing `client` or `fileTypeId`** cancels an upload in progress and starts over with the new File Type.

#### `useFileUpload(client, fileTypeId, { recordId, onUpload })`

The hook `ADSPFileUpload` uses. It returns `{ fileType, loading, typeError, ready, uploads, uploading, upload, retry, remove, reloadType }`. `upload` takes one file or several; each becomes an entry in `uploads` with an `id`, the `file`, a `status` of `uploading`, `uploaded` or `failed`, `progress`, `uploaded` and `error`. `retry(id)` uploads a failed file again when its error is retryable, `remove(id)` cancels or dismisses one, and `reloadType()` loads the File Type again after it failed. Use it to build a different upload experience on the same File service behaviour.

## Building a component

Every ADSP React component follows the same four rules:

1. **Read the theme from context.** Call `useAdspThemeStyle('<component>', themeOverrides)` and spread it onto the component's root element. The only theme-related prop is a typed `themeOverrides` for the component's own tokens.
2. **Style it with classes from its stylesheet in core** (`src/lib/<component>/adsp-<component>.css`, imported by `adsp-components.css`). Don't use inline styles or CSS-in-JS, or the Angular and Vue adapters couldn't share the styles.
3. **Don't offer `className`, `style` or render-override props.** Teams change how a component looks through the theme, provider `overrides` or `themeOverrides`.
4. **Import shared types from core.** Token types and shared values such as `AdspCalendarTheme` and `CalendarView` live in core, so every framework uses the same values.

```tsx
import { type AdspComponentThemeOverrides, type CalendarView, type ICalendarClient } from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';

interface ADSPCalendarProps {
  client: ICalendarClient;
  calendar: string;
  defaultView?: CalendarView;
  themeOverrides?: AdspComponentThemeOverrides<'calendar'>;
  testId?: string;
}

export const ADSPCalendar = ({
  client,
  calendar,
  defaultView = 'month',
  themeOverrides,
  testId,
}: ADSPCalendarProps) => {
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
