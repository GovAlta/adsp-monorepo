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

# JsonFormContextInstance

To use the package, and the context surrounding it, it's best to import JsonFormContextInstance attach data to it

Here are some sample api endpoints that work currently.

```

import { JsonFormContextInstance } from '@abgov/jsonforms-components';


  useEffect(() => {
    JsonFormContextInstance.addDataByUrl('dog-list', 'https://dog.ceo/api/breeds/list/all', processDogs);
    JsonFormContextInstance.addDataByUrl(
      'basketball-players',
      'https://www.balldontlie.io/api/v1/players',
      processPlayers
    );
    JsonFormContextInstance.addDataByUrl(
      'car-brands',
      'https://parallelum.com.br/fipe/api/v1/carros/marcas',
      processCarBrands
    );

    JsonFormContextInstance.addData(
      'countries',
      Countries.map((country) => country.country)
    );

  }, []);

  function processDogs(rawData): string[] {
    return Object.keys(rawData.message);
  }
  function processPlayers(rawData): string[] {
    return rawData.data.map((player) => `${player.first_name} ${player.last_name}`);
  }
  function processCarBrands(rawData): string[] {
    return rawData.map((brand) => brand.nome);
  }

```

Once you add them, you can add the following to any UI Schema control to create a dropdown that displays them

```
  "type": "Control",
  "scope": "#/properties/carBrands",
  "options": {
    "enumContext": {
      "key": "car-brands",
```

You also need to add the following to the data schema

```
 "carBrands": {
    "type": "string",
    "enum": [
      ""
    ]
 }
```

# Schemas only with no code changes

To access the apis without making any code changes to add an api,

```
import { JsonFormContextInstance } from '@abgov/jsonforms-components';

const { jsonFormContext, baseEnumerator } = JsonFormContextInstance;

return(
  <jsonFormContext.Provider value={baseEnumerator}>
    <JsonForms
      schema={...}
      uischema={...}
      ...
    />
  />
)
```

Data Schema

```
  "carBrands": {
    "type": "string",
    "enum": [
      ""
    ]
  },
  "countries": {
    "type": "string",
    "enum": [
      ""
    ]
  },
  "dogBreeds": {
    "type": "string",
    "enum": [
      ""
    ]
  },
  "basketballPlayers": {
    "type": "string",
    "enum": [
      ""
    ]
  }
```

Ui Schema

```
{
  "type": "HorizontalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/carBrands",
      "options": {
        "enumContext": {
          "key": "car-brands",
          "url": "https://parallelum.com.br/fipe/api/v1/carros/marcas",
          "values": "nome"
        }
      }
    },
    {
      "type": "Control",
      "scope": "#/properties/dogBreeds",
      "options": {
        "enumContext": {
          "key": "dog-list",
          "url": "https://dog.ceo/api/breeds/list/all",
          "location": "message",
          "type": "keys"
        }
      }
    },
    {
      "type": "Control",
      "scope": "#/properties/basketballPlayers",
      "options": {
        "enumContext": {
          "key": "basketball-players",
          "location": "data",
          "url": "https://www.balldontlie.io/api/v1/players",
          "values": [
            "first_name",
            "last_name"
          ]
        }
      }
    },
    {
      "type": "Control",
      "scope": "#/properties/countries",
      "options": {
        "enumContext": {
          "key": "countries"
        }
      }
    }
  ]
}
```

Countries in this example comes locally.

```
import Countries from './countries';

--------

export default [
  { country: 'Russia', land_mass_km2: 17098242 },
  { country: 'Canada', land_mass_km2: 9976140 },
  ...
]
```

Another way to add data to ContextProvider (optional)

```
const animals = {
  animals: [
    { name: 'Elephant', type: 'Mammal', habitat: 'Land' },
    { name: 'Penguin', type: 'Bird', habitat: 'Ice' },
    { name: 'Kangaroo', type: 'Mammal', habitat: 'Grasslands' },
    { name: 'Giraffe', type: 'Mammal', habitat: 'Savanna' },
    { name: 'Octopus', type: 'Invertebrate', habitat: 'Ocean' },
    { name: 'Cheetah', type: 'Mammal', habitat: 'Grasslands' },
    { name: 'Koala', type: 'Mammal', habitat: 'Eucalyptus Forest' },
    { name: 'Toucan', type: 'Bird', habitat: 'Rainforest' },
    { name: 'Dolphin', type: 'Mammal', habitat: 'Ocean' },
    { name: 'Arctic Fox', type: 'Mammal', habitat: 'Arctic Tundra' },
  ],
};


  <ContextProvider data={[{ animals }]}
    <JsonForms
      ...
    </>
  </ContextProvider>

```
