---
layout: page
title: Integration
parent: Form Service
grand_parent: Tutorials
nav_exclude: false
---

## Integration

Integrating Jsonforms into your application is straight forward. You simply place [their react component](https://jsonforms.io/docs/integrations/react/) where you need it, like this:

```javascript
<JsonForms schema={schema} uischema={uiSchema} data={data} renderers={GoARenderers} onChange={onChange} />
```

where:

- The schema and uiSchema are the ones you built in [the Form Editor](/adsp-monorepo/tutorials/form-service/form-editor.html), and can be retrieved with [the Form Service APIs](https://api.adsp-dev.gov.ab.ca/autotest/?urls.primaryName=Form%20service).

- The data is a javascript object conforming to your JSON schema, which will be updated as the user enters information.

- The GoARenderers are a library of React components built by ADSP to render the form using the GoA [Design Systems](https://design.alberta.ca/) components. You can install this library via:

```
npm install @abgov/jsonforms-components
```

- onChange is A callback which is called on each data change, containing the updated data and the validation result.

There are several other parameters you can pass into the Jsonforms component to tailor it to you needs, including [custom validation](https://jsonforms.io/docs/validation/) with [AJV](https://github.com/ajv-validator/ajv).
