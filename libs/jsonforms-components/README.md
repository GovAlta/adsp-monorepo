# jsonforms-components

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test jsonforms-components` to execute the unit tests via [Jest](https://jestjs.io).

# Folder hierarchy

```
- src
  - lib
    - GoARenders
      - <GoAComponent A Reducer>
        ...
      - <GoAComponent B Reducer>
        ...
```

# GoA UI component JSON Forms UI Schema

[UI Schema](https://jsonforms.io/docs/uischema) in the JSON Forms defines the general layout of the forms generated. @abgov/jsonforms-components lib integrates the [GoA UI components](https://github.com/GovAlta/ui-components) form components by extending the "options" attribute in the UI Schema. Take GoAInput UI Schema as example:

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
