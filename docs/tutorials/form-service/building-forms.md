---
title: Building Forms
layout: page
nav_order: 2
parent: Form Service
grand_parent: Tutorials
---

## Building Forms

The _Form Service_ can be used to build some very sophisticated forms and includes directives that allow you to add:

- input controls
- control groups
- steppers
- inline instructions
- input validators
- element lists
- rules controlling the visibility of form elements

Jsonforms itself has [moderately good documentation](https://jsonforms.io/examples/basic/) on how this all works; please read through their information to get a better sense of how the schemas need to be set up.

### Getting Started

You build forms using the ADSP Form Service's _Form Editor_. Log in to the [Tenant-Management-Webapp](https://adsp-uat.alberta.ca) and select the _form service_. You will see something like this:

![](/adsp-monorepo/assets/form-service/FormDefinition.png){: width="400" }

Add a new _form definition_ to try things out. When you click save to create your form definition you will be brought to the form editor:

![](/adsp-monorepo/assets/form-service/FormEditor.png){: width="600" }

The editor has two components; the editor itself, and the preview. The latter shows you how your form will look to the end users and is useful as a guide when building. Try entering a simple data-schema:

```json
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

```json
{
  "type": "HorizontalLayout",
  "label": "Name",
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

![](/adsp-monorepo/assets/form-service/FormPreview.png){: width="400" }

That's it. Once you learn the basics of building forms through schemas, you'll be able to build some pretty impressive forms for your end-users to fill in.

### Form Steppers

Many forms at the GoA can be rather large and complex, and should be divided into a number of steps for the end-use to complete. This is where a form stepper becomes useful.

### Adding Instructions to your form

You can [add text, images, and links to your forms](/adsp-monorepo/tutorials/task-service/instructions.html) to help clarify the information that is needed from end-users when filling out the form.

### Form Rules

Sometimes a specific answer to a question will influence the flow of the form.

### Input Validation

### Element Arrays

## Learn More

- Learn how to [use jsonforms](https://jsonforms.io/) to declaratively build and render your forms.
