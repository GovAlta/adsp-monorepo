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

That's it! You're on your way to building some pretty impressive forms for your end-users to fill in.

### Form Steppers

Many forms at the GoA can be rather large and complex, and should be divided into a number of steps for the end-use to complete. This is where a form stepper becomes useful.

### Adding Instructions to your form

One of the differences between a professional and an armature looking form is the quality of instruction that it contains for end-users. The ADSP _Form Service_ includes component renderers that are specifically geared toward rendering instructions. For example, there is the _HelpContent_ control-type that you can use to render a paragraph of text:

```json
{
  "type": "HelpContent",
  "label": "Program Overview",
  "options": {
    "help": "The Alberta Approved Farmers’ Market Program was started in 1973 as a way to provide an opportunity for local Alberta businesses to sell their products. Farmers’ markets are a critical channel for business incubation – entrepreneurs start in markets, test market their products and develop business skills. The Program creates an operational framework, providing direction and guidance to approved farmers’ markets in Alberta through provincial guidelines that outline minimum requirements and best practices."
  }
}
```

by combining several HelpContent types into a list you can create a full page of instructions to help your end-users navigate the form e.g.

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "HelpContent",
      "label": "",
      "options": {
        "help": "1. Must operate on a non-profit basis. This can be achieved in a number of ways:"
      }
    },
    {
      "type": "HelpContent",
      "elements": [
        {
          "type": "HelpContent",
          "label": "Sponsored by:",
          "options": {
            "help": [
              "Registered not-for-profit community group or organization;",
              "Registered Chamber of Commerce;",
              "Municipality; or",
              "Agricultural society formed under the Agricultural Societies Act (Alberta)"
            ]
          }
        }
      ]
    }
  ]
}
```

will render

![](/adsp-monorepo/assets/form-service/HelpExample.png)

Notice that providing an array of text fragments in options/help will render as a bulleted list of points.

### Form Rules

Sometimes a specific answer to a question will influence the flow of the form.

### Input Validation

### Element Arrays

## Learn More

- Learn how to [use jsonforms](https://jsonforms.io/) to declaratively build and render your forms.
