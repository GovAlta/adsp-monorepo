---
title: Building Forms
layout: page
nav_order: 2
parent: Form App
grand_parent: Tutorials
---

## Building Forms

Jsonforms can be used to build some very sophisticated forms and includes directives that allow you to add:

- input controls
- control groups
- steppers
- inline instructions
- input validators
- rules to control the visibility of form elements

They have [moderately good documentation](https://jsonforms.io/examples/basic/) on how this all works; please read through their information to get a better sense of how the schemas need to be set up.

### Getting Started

You build forms using the ADSP Form Service's _Form Editor_. Log in to the [Tenant-Management-Webapp](https://adsp-uat.alberta.ca) and select the _form service_. You will see something like this:

![](/adsp-monorepo/assets/form-app/FormDefinition.png)

Add a new _form definition_ to try things out. When you click save to create your form definition you will be brought to the form editor:

![](/adsp-monorepo/assets/form-app/FormEditor.png){: width="600" }

The editor has two components; the editor itself, and the preview. The latter shows you how your form will look to the end users and is useful as a guide when building. Try entering a simple data-schema:

```
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    }
  }
}
```

followed by its corresponding ui-schema:

```
{
  "type":"HorizontalLayout",
  "label":"Name",
  "elements": [
    {
    "type": "Control",
    "scope": "#/properties/firstName"
    },
    {
    "type": "Control",
    "scope": "#/properties/lastName"
    }
  ]
}
```

You will see something like this:
![](/adsp-monorepo/assets/form-app/FormPreview.png){: width="400" }

That's it! You're on your way to building some pretty impressive forms for your end-users to fill in.

### Building Steppers

### Adding Instructions to your form

### Form Rules

### Input Validation

## Learn More

- Learn how to [use jsonforms](https://jsonforms.io/) to declaratively build and render your forms.
