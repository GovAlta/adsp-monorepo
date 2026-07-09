# How to Add a Service Component to the Sandbox App

This guide walks through the steps required to register and display a new service in the sandbox app.
<br>
The Sandbox application is to allow developers on the ADSP team to create POC, samples to test there Spike work or general investigation to reproduce an issue that is discovered in UAT or Production.

---

## File Locations

| File                                                                   | Purpose                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `apps/sandbox-app/src/app/components/Services.tsx`                     | Service registry and landing grid                      |
| `apps/sandbox-app/src/app/components/SandboxTenant.tsx`                | Route declarations for all services                    |
| `apps/sandbox-app/src/app/components/services/`                        | Directory where service `*Main.tsx` components live    |
| `apps/sandbox-app/src/app/components/services/types.ts`                | Shared `ServiceMainProps` interface                    |
| `apps/sandbox-app/src/app/components/services/<yourService>/`          | Subdirectory for sub-page components                   |
| `apps/sandbox-app/src/app/util/servicePageUtils.ts`                    | Helper functions that build `ServicePage[]` link lists |
| `apps/sandbox-app/src/app/components/services/ServiceListTemplate.tsx` | Renders a list of links to sub-pages                   |
| `apps/sandbox-app/src/app/state/<yourService>.slice.ts`                | Redux slice for service state (if needed)              |
| `apps/sandbox-app/src/app/state/index.ts`                              | Barrel export for all state slices                     |
| `apps/sandbox-app/src/app/state/store.ts`                              | Registers reducers with the Redux store                |

---

## Step 1 – Create the Main component file

Create a new file inside `apps/sandbox-app/src/app/components/services/` named `<YourService>Main.tsx`.

The component must accept `ServiceMainProps` (imported from `./types`).

**Simple service (no sub-pages):** render content directly inside `GoabContainer`.

**Service with sub-pages:** use `ServiceListTemplate` to render a list of links to example pages. The list of pages is built by a helper function in `servicePageUtils.ts` (see Step 2).

```tsx
// apps/sandbox-app/src/app/components/services/<YourService>Main.tsx

import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { ServiceListTemplate } from './ServiceListTemplate';
import { add<YourService>Pages } from '../../util/servicePageUtils';

export const <YourService>Main = ({ tenantName }: ServiceMainProps) => {
  const pages = add<YourService>Pages(tenantName);

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'<yourService>Container'}
        heading={'<Your Service>'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the <Your Service>.
        </GoabText>
        <ServiceListTemplate servicePages={pages} />
      </GoabContainer>
    </ServiceContainer>
  );
};
```

Place sub-page components in a subdirectory:

```
apps/sandbox-app/src/app/components/services/<yourService>/
  <YourService>Main.tsx
  <YourService>ExampleOne.tsx
  ...
```

---

## Step 2 – Register sub-page URLs in `servicePageUtils.ts`

Open `apps/sandbox-app/src/app/util/servicePageUtils.ts` and add a function that returns the `ServicePage[]` array for your service. Each entry becomes one link in the `ServiceListTemplate`.

```ts
export const add<YourService>Pages = (tenantName: string) => {
  const prefix = `/${tenantName}/services/<your-service-path>`;
  const pages: ServicePage[] = [
    {
      id: '<yourService>ExampleOne',
      name: '<Your Service> Example 1',
      url: `${prefix}/example1/<route-param>`,
      testId: '<yourService>Example1',
    },
    // add more entries as needed
  ];

  return pages;
};
```

Import `ServicePage` from `'../components/services/ServiceListTemplate'` at the top of the file.

---

## Step 3 – Create sub-page components

Create one component file per example page inside `apps/sandbox-app/src/app/components/services/<yourService>/`.

Sub-page components use `useParams()` to read URL parameters, Redux selectors to load data, and render their UI inside a `GoabContainer`. Based on `JsonformsExampleOne.tsx` as a reference:

```tsx
// apps/sandbox-app/src/app/components/services/<yourService>/<YourService>ExampleOne.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch, busySelector, tenantSelector } from '../../../state';
import { LoadingIndicator } from '../../LoadingIndicator';
import { ServiceContainer } from '../../styled-components';
import { GoabContainer } from '@abgov/react-components';

export const <YourService>ExampleOne = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { <routeParam> } = useParams();
  const tenant = useSelector(tenantSelector);
  const busy = useSelector(busySelector);

  useEffect(() => {
    if (tenant) {
      // dispatch an action to load data based on <routeParam>
    }
  }, [dispatch, <routeParam>, tenant]);

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'<yourService>ExampleOneContainer'}
        heading={'<Your Service> Example 1'}
      >
        {/* Render your example content here */}
      </GoabContainer>
    </ServiceContainer>
  );
};
```

Key points mirrored from `JsonformsExampleOne.tsx`:

- Use `useMemo` for expensive objects (e.g. AJV instances, renderer arrays) to avoid recreating them on every render.
- Use `useCallback` for event handlers passed as props.
- `LoadingIndicator` should wrap any async data dependencies.

---

## Step 4 – Register the service in `Services.tsx`

Open `apps/sandbox-app/src/app/components/Services.tsx` and add an entry to the `SERVICES` array:

```tsx
{
  id: '<YourService>',
  name: '<Your service display name>',
  show: true,
  description: '<Short description shown on the service card>',
  url: '/<your-service-path>',
},
```

- `id` — unique identifier string; used as the `testId` on the service card
- `url` — the URL segment appended to the tenant path (e.g. `/your-service` → `/:tenant/services/your-service`)

The `sortServices` call in the render function sorts entries alphabetically by `name` automatically, so order in the array does not matter.

---

## Step 5 – Add routes in `SandboxTenant.tsx`

Open `apps/sandbox-app/src/app/components/SandboxTenant.tsx`.

1. Import the main component and any sub-page components at the top of the file:

   ```tsx
   import { <YourService>Main } from './services/<yourService>/<YourService>Main';
   import { <YourService>ExampleOne } from './services/<yourService>/<YourService>ExampleOne';
   ```

2. Add a route for the main service page **and a separate route for each sub-page** inside the `<Routes>` block. Sub-page routes are siblings of the main route, not nested inside it:

   ```tsx
   <Route path="/services/<your-service-path>" element={<<YourService>Main tenantName={tenantName} />} />
   <Route path="/services/<your-service-path>/example1/:<routeParam>" element={<<YourService>ExampleOne />} />
   ```

   - The main route path must match the `url` in `Services.tsx` (prefixed with `/services`).
   - Sub-page route paths must match the `url` values defined in `servicePageUtils.ts`.
   - Sub-page components that use `useParams()` do not need `tenantName` as a prop.

---

## Step 6 – Add a Redux slice (if needed)

If your service requires its own async actions, state, or selectors, create a slice in `apps/sandbox-app/src/app/state/`.

### 6a – Create the slice file

Create `apps/sandbox-app/src/app/state/<yourService>.slice.ts` following the Redux Toolkit pattern used by the existing slices:

```ts
// apps/sandbox-app/src/app/state/<yourService>.slice.ts

import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppState } from './store';
import { getAccessToken } from './user.slice';

export const <YOUR_SERVICE>_FEATURE_KEY = '<yourService>';

interface <YourService>State {
  data: Record<string, unknown> | null;
  busy: {
    loading: boolean;
  };
}

const initialState: <YourService>State = {
  data: null,
  busy: {
    loading: false,
  },
};

export const fetch<YourService>Data = createAsyncThunk(
  '<yourService>/fetch',
  async (param: string, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const token = await getAccessToken();
      // Make your API call here
      // const response = await axios.get(...);
      // return response.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

const <yourService>Slice = createSlice({
  name: <YOUR_SERVICE>_FEATURE_KEY,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetch<YourService>Data.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(fetch<YourService>Data.fulfilled, (state, { payload }) => {
        state.data = payload;
        state.busy.loading = false;
      })
      .addCase(fetch<YourService>Data.rejected, (state) => {
        state.busy.loading = false;
      });
  },
});

export const <yourService>Reducer = <yourService>Slice.reducer;

export const <yourService>Selector = createSelector(
  (state: AppState) => state[<YOUR_SERVICE>_FEATURE_KEY],
  (slice) => slice
);
```

### 6b – Export from `index.ts`

Add an export line to `apps/sandbox-app/src/app/state/index.ts`:

```ts
export * from './<yourService>.slice';
```

### 6c – Register the reducer in `store.ts`

Open `apps/sandbox-app/src/app/state/store.ts` and:

1. Import the feature key and reducer:

   ```ts
   import { <YOUR_SERVICE>_FEATURE_KEY, <yourService>Reducer } from './<yourService>.slice';
   ```

2. Add the reducer to the `configureStore` `reducer` map:

   ```ts
   [<YOUR_SERVICE>_FEATURE_KEY]: <yourService>Reducer,
   ```

After this step, `AppState` (inferred from `store.getState`) will automatically include the new slice, so selectors typed against `AppState` will work without additional changes.

---

## Summary of changes

| Step | File changed                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1    | Create `apps/sandbox-app/src/app/components/services/<yourService>/<YourService>Main.tsx`                                    |
| 2    | `apps/sandbox-app/src/app/util/servicePageUtils.ts` — add `add<YourService>Pages()` function                                 |
| 3    | Create `apps/sandbox-app/src/app/components/services/<yourService>/<YourService>ExampleOne.tsx`                              |
| 4    | _(if needed)_ `apps/sandbox-app/src/app/components/Services.tsx` — add entry to `SERVICES` array                             |
| 5    | `apps/sandbox-app/src/app/components/SandboxTenant.tsx` — add imports and `<Route>` entries                                  |
| 6    | _(if needed)_ Create `apps/sandbox-app/src/app/state/<yourService>.slice.ts`, export from `index.ts`, register in `store.ts` |

---

## Notes

- The `ServiceMainProps` interface (`{ tenantName: string }`) is the standard prop contract for all service main components; do not change it.
- Sub-page routes are declared as siblings in `SandboxTenant.tsx`, not nested inside the main component.
- Sub-page components use `useParams()` for route parameters rather than receiving them as props.
- Use `useMemo` for expensive objects and `useCallback` for event handler props to avoid unnecessary re-renders (see `JsonformsExampleOne.tsx`).
- Use `GoabContainer` with `accent="thick"` and `type="non-interactive"` to stay consistent with the existing service component style.
