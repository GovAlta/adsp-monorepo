---
layout: page
title: Steppers
parent: Form Service
grand_parent: Tutorials
nav_exclude: false
---

# Form Steppers

Form steppers divide your form into manageable steps, like so:

![](/adsp-monorepo/assets/form-service/formAppExample.png){: width="800" }

The underlying technology is the [Design Systems stepper](https://design.alberta.ca/components/form-stepper#tab-0) coupled with the conventions used with Jsonforms for steppers. In line with these conventions the UI schema for a stepper is called a _categorization_, and each step is called a _category_. For example, here's a simple schema that could be used to collect a user's name and address information;

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "object",
      "properties": {
        "firstName": {
          "type": "string",
          "minLength": 2
        },
        "lastName": {
          "type": "string",
          "minLength": 2
        },
        "initial": {
          "type": "string",
          "maxLength": 1
        }
      }
    },
    "address": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      }
    }
  }
}
```

Its a bit of overkill, but for illustrative purposes we'll put the name and address fields into separate steps, like so:

```json
{
  "type": "Categorization",
  "elements": [
    {
      "type": "Category",
      "label": "Name",
      "elements": [
        {
          "type": "VerticalLayout",
          "elements": [
            {
              "type": "Control",
              "scope": "#/properties/name/properties/firstName"
            },
            {
              "type": "Control",
              "scope": "#/properties/name/properties/lastName"
            },
            {
              "type": "Control",
              "scope": "#/properties/name/properties/initial"
            }
          ]
        }
      ]
    },
    {
      "type": "Category",
      "label": "Address",
      "elements": [
        {
          "type": "VerticalLayout",
          "elements": [
            {
              "type": "Control",
              "scope": "#/properties/address/properties/street"
            },
            {
              "type": "Control",
              "scope": "#/properties/address/properties/city"
            }
          ]
        }
      ]
    }
  ],
  "options": {
    "variant": "stepper"
  }
}
```

Which yields:

![](/adsp-monorepo/assets/form-service/stepperExample.png){: width="500" }

Notice:

- The Categorization has two Categories labeled _Name_ and _Address_. This grouping tells the rendering engine to create a stepper with 2 steps, labeled as _Name_ and _Address_ respectively.
- The Categorization element has an _options variant_ set to _stepper_. Although we currently only have the one variant, it is mandatory to have this option.
- The stepper includes navigation buttons for moving between pages.
- Everything else is declared as it would be without the stepper.
- There is an extra step added to the stepper, named _Review_. This is a GOA added feature added to let the applicant quickly review the data they have entered for completeness.

![](/adsp-monorepo/assets/form-service/stepperReview.png){: width="500" }
