# jsonforms-components

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test jsonforms-components` to execute the unit tests via [Jest](https://jestjs.io).

# Folder hierarchy

```
- src
  - lib
    - Additional
    - Cells
    - common
    - Components
    - Controls
    - Context
    - ErrorHandling
    - layouts
    - util

```

# Embedding ADSP Form service UI components in your application

To use ADSP Forms service UI components add in JSON Forms into your application. You will have to include the following JSX markup and imports into your React components as an example.

```
import { JsonForms } from '@jsonforms/react';
import {
  GoARenderers,
} from '@abgov/jsonforms-components';
```

```
      <JsonForms
        schema={yourJSONDataSchema}
        uischema={yourJSONUISchema}
        data={data}
        validationMode="ValidateAndShow"
        renderers={GoARenderers}
        onChange={onChange}
      />
```

# ADSP Form service UI components UI schema

[UI Schema](https://jsonforms.io/docs/uischema) in the JSON Forms defines the general layout of the forms generated. @abgov/jsonforms-components lib integrates the [GoA UI components](https://github.com/GovAlta/ui-components) form components by extending the "options" attribute in the UI Schema. Take GoAInput UI Schema as example:
https://govalta.github.io/adsp-monorepo/tutorials/form-service/building-forms.html

```
    {
      "type": "Control",
      "scope": "#/properties/name",
      "options": {
        "GoAInput": {
          "name": "Name",
          "label": "Name",
          "testId": ""
          ...
        }
      }
    }
```

The presence of the "GoAInput" indicates we are going to use the GoAInput to render the input. The attributes in the "GoAInput" will be passed to the GoAInput as component properties.

For additional information and usage pertaining to the controls, layouts, steppers, please refer to the ADSP Form service guide which provides more in [depth information](https://govalta.github.io/adsp-monorepo/tutorials/form-service/form-service.html) on the usage.

Please refer to the [Cheat sheet](https://govalta.github.io/adsp-monorepo/tutorials/form-service/cheat-sheet.html) which contains schema examples for the different types of controls, steppers, layouts, etc that are currently available from ADSP Form service UI components that can used in your UI schema of your application.
