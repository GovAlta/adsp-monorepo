---
title: Data registers
layout: page
parent: Form Service
grand_parent: Tutorials
nav_exclude: false
---

To setup data registers that can populate drop down list there is two areas that you must do to
achieve this.

- [Data registers](#data-registers)
- [Data register context](#context)

<h3 id="data-registers">Data registers</h3>

When there is a need to retrieve a list of values that are needed to populate a drop down from an external data source.
We have two options to accomplish this operation.

  <ol>
    <li>
      Using ADSP Configuration service by adding a configuration definition to retrieving the list of values.
    </li>
    <li>
      Provide a URL REST API endpoint to retrieve the list of values.
    </li>
  </ol>

### Using Configuration service - defining the JSON payload schema

#### Example 1:

In this example we are only accepting array of string values.

```
{
  "type": "array",
  "items": {
    "type": "string"
  },
  "required": [],
  "additionalProperties": true
}
```

#### Example 2:

In this example, we are defining a couple properties called "label" and "value" which is usually part of
a drop down for array object.

```
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "value": {
        "type": "string"
      },
      "label": {
        "type": "string"
      }
    }
  },
  "properties": {},
  "required": [],
  "additionalProperties": true
}
```

Once you have defined your schema you will go to the Configuration Service &rarr; Revisions tab and select the configuration definition from the drop down and click on the edit button and enter the data for the list of values.

This example maps to example 1 from the schema above:

```
[
  "value1",
  "value2",
  "value3",
]
```

This example maps to example 2 from the schema above that has "label" and "value" as a property.

```
[
  {
    "label": "label 1",
    "value": "value 1"
  },
    {
    "label": "label 2",
    "value": "value 2"
  }
]
```

Once you have configured the configuration service schema for your data registers you are ready to go to the form editor and make modifications to your UI and data schema to include your data registers on the file upload control.

#### Data schema

```
{
  "type": "object",
  "properties": {
    "provinces": {
      "type": "string",
      "enum": [
        ""
      ]
    }
  }
}
```

#### UI schema

For the UI schema there are two methods that you use to populate your drop down.

The first method is to use the Configuration service and use the data register configuration service using the URN.

The example below shows what the UI schema you would need.

```
 {
  "type": "Control",
  "scope": "#/properties/provinces",
  "label": "Province",
  "options": {
    "register": {
      "urn": "urn:ads:platform:configuration:v2:/configuration/public-register/public-register-1"
    }
  }
}
```

Please refer to [Configuration service](/adsp-monorepo/services/configuration-service.html) for more details.

The second method is to use an external REST API endpoint to retrieve data to populate the drop down.

For example, the following is a JSON returned back from the REST API

```
[
  {
    "codigo": "1",
    "nome": "Acura"
  }
]
```

The `objectPathInArray` property is used to populate the label and value for the drop down item. So from the above JSON object 'nome' will be the property that is used to populate the label and value for the drop down item.

```
  {
    "type": "Control",
    "scope": "#/properties/cars",
    "options": {
      "register": {
        "url": "https://parallelum.com.br/fipe/api/v1/carros/marcas",
        "objectPathInArray": "nome"
      }
    }
  }
```

<h3 id="context"> Data register context</h3>

In conjunction with setting up data registers through the configuration service or through an external endpoint. We will need to add in the ADSP context for the data registers through React code.

```typescript
import { GoARenderers, createDefaultAjv, JsonFormRegisterProvider } from '@abgov/jsonforms-components';
```

```typescript
export const populateDropdown = (schema, enumerators) => {
  const newSchema = JSON.parse(JSON.stringify(schema));

  Object.keys(newSchema.properties || {}).forEach((propertyName) => {
    const property = newSchema.properties || {};
    if (property[propertyName]?.enum?.length === 1 && property[propertyName]?.enum[0] === '') {
      property[propertyName].enum = enumerators?.getFormContextData(propertyName) as string[];
    }
  });

  return newSchema as JsonSchema;
};
```

```jsx
const enumerators = useContext(JsonFormContext) as enumerators;
<JsonFormRegisterProvider defaultRegisters={definition?.registerData || []}>
  <JsonForms
    ajv={createDefaultAjv()}
    readonly={false}
    schema={populateDropdown(definition.dataSchema, enumerators)}
    uischema={definition.uiSchema}
    data={data}
    validationMode="ValidateAndShow"
    renderers={GoARenderers}
    onChange={onChange}
  />
</JsonFormRegisterProvider>;
```
