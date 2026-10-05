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

When a drop down needs a list of values, there are two options.

  <ol>
    <li>
      Use an ADSP data register. You manage data registers in the tenant management webapp or through the form service API.
    </li>
    <li>
      Provide a URL REST API endpoint to retrieve the list of values.
    </li>
  </ol>

### Using a data register

A data register is a named list of values. Each value is either a string or an object, for example an object with `label` and `value` properties.

#### Managing data registers in the tenant management webapp

Go to Form service &rarr; Register data tab.

- Click **Add register data** and enter a name, an optional description and the values. Names can contain letters, numbers, spaces, hyphens and underscores, can be up to 50 characters long, and must be unique within your tenant. Enter the values separated by commas, new lines or semicolons, or select **Use JSON format** and enter a JSON array.
- Click the eye icon on a register to view its values and copy its URN.
- Click the edit icon on a register to change its values as a JSON array.
- Click the delete icon on a register to delete it. Forms that reference a deleted register lose its options.

#### Managing data registers through the API

You can also manage data registers through the form service API at `/form/v1/registers`. This requires the `form-admin` role or the configuration service `configuration-admin` role. See [Form service](/adsp-monorepo/services/form-service.html#data-registers) for the full API.

```typescript
const response = await fetch('https://form-service.adsp.alberta.ca/form/v1/registers', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'provinces',
    description: 'Canadian provinces',
    entries: ['Alberta', 'British Columbia', 'Saskatchewan'],
  }),
});
```

#### Register values

This register holds string values:

```
[
  "value1",
  "value2",
  "value3"
]
```

This register holds objects with `label` and `value` properties:

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

Each data register has a URN in the form `urn:ads:platform:configuration:v2:/configuration/data-register/<name>`. You use it in the UI schema to reference the register. Names with spaces are not encoded, so the URN is exactly what the Register data tab shows.

Once your data register is set up, go to the form editor and add it to your data and UI schemas for the drop down.

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

The first method is to reference a data register by its URN.

The example below shows the UI schema you would need.

```
 {
  "type": "Control",
  "scope": "#/properties/provinces",
  "label": "Province",
  "options": {
    "register": {
      "urn": "urn:ads:platform:configuration:v2:/configuration/data-register/provinces"
    }
  }
}
```

You can also reference configuration in other namespaces, for example `urn:ads:platform:configuration:v2:/configuration/public-register/public-register-1`. Its configuration definition schema must be an array of strings or an array of objects. You set up these registers directly in configuration service. They aren't managed by the Register data tab or the form service API.

By default, only signed-in users can read a register. To use a register in a form that allows anonymous applicants, go to Configuration service &rarr; Definitions. Edit the register's definition, which has the namespace `data-register` and the register's name, and select **Allow anonymous access**. The Register data tab and the form service API keep this setting when they update a register, but they never set it.

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
