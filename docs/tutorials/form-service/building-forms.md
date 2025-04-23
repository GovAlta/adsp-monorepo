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

Jsonforms itself has [moderately good documentation](https://jsonforms.io/examples/basic/) on how this all works; please read through their information to get a better sense of how the schemas need to be set up. If you wish to dive right in, however, here's how you can easily [build and preview](/adsp-monorepo/tutorials/form-service/form-editor.html) your forms through ADSP's Form Editor.

### Steppers

Many forms at the GoA can be rather large and complex, and could be divided into a number of smaller steps for ease of use. This is where [form steppers](/adsp-monorepo/tutorials/form-service/steppers.html) become useful.

### Form Rules

Sometimes a specific answer to a question will influence the flow of the form. A yes answer, for example, may uncover further questions, or a particular income value may disable followup questions. Jsonforms uses [rules](https://jsonforms.io/docs/uischema/rules/) to handle the dynamic aspects of form intake.

### Input Validation

Jsonforms automatically handles basic input validation, such as ensuring required fields are filled in, dates are formatted correctly, or that numbers are, indeed, numbers. More sophisticated validation is also possible; you can add [custom error messages](https://jsonforms.io/docs/validation/) or even [integrate a custom AJV validator](https://jsonforms.io/docs/validation/) to [harness the full power of AJV](https://ajv.js.org/), which gives you complete control over validation.

#### Required Fields

There is a known issue in jsonforms that allows an empty string to satisfy the required validation rule. To work around this, you should also add a minimum length of 1 to required string fields, e.g.

```json
{
  "firstName": {
    "type": "string",
    "minLength": 1
  },
  "required": ["firstName"]
}
```

#### Conditional Validation

Form validation can be conditional; something that is especially important when working with hidden fields. For example, suppose a form has a boolean field called _hasChildren_. When a use checks it some hidden fields appear, like _childsFirstName_ and _childsLastName_. If the latter are marked as required and hasChildren remains false, the form validation would fail because the user couldn't enter any values for the hidden names. Even worse, there really wouldn't be any clues as to why the form was failing.

To help manage these situations the form service has implemented _conditional validations_ for JSON Schemas, based on the if-then-else construct introduce in [json schema draft 7](https://json-schema.org/draft-07). With this we can specify such things as "if hasChildren is true then make _childsFirstName_ and _childsLastName_ required, otherwise they are not". The syntax in the JSON Schema would look like this:

```json
  "if": {
    "properties": {
      "hasChildren": {
        "const": true
      }
    }
  },
  "then": {
    "required": [
      "childsFirstName",
      "childsLastName"
    ]
  }
```

"if" and "then" are treated as attributes of the schema, and can appear anywhere at the top level (same level as "required" or "properties"). However, since they are _properties_ there can only be one "if" or "else" at that level, which limits their usefulness. If you have more than one dependent validation though, you can wrap them in an "allOf" property, like so:

```json
"allOf": [
  {
    "if": {
      "properties": {
        "hasChildren": {
          "const": true
        }
      }
    },
    "then": {
      "required": [
        "childsFirstName",
        "childsLastName"
      ]
    }
  },
  {
    "if": {
      "properties": {
        "category": {
          "const": "Highway Issues"
        }
      }
    },
    "then": {
      "required": [
        "highwayIssues"
      ]
    }
  }
]
```

This says that if _hasChildren_ is checked then child names are required, and if _category_ has the value _Highway Issues_ then the subcategory _highwayIssues_ is required. You can add as many dependencies of this type as needed.

You can conditionally specify pretty much any validation that is part of the JSON schema, such as patterns, length, or even format.

### Repeating Items

You will sometimes need to capture [lists of information](/adsp-monorepo/tutorials/form-service/repeated-items.html) in a form. Lists contain a variable number of items, each containing the necessary details. For example, an application for a Farmers Market License may require list of vendors, each with contact information, a classification, and their expected yearly revenue. Users are able to add one item at a time and fill in the details as needed.

### ADSP Enhancements

ADSP has added several enhancements to the form builder in order to help designers and developers create professional looking forms. These include:

- Adding [text, images, and links](/adsp-monorepo/tutorials/form-service/instructions.html) to forms in order to help clarify the information that is needed from end-users when filling them out.
- A [file upload widget](/adsp-monorepo/tutorials/form-service/file-uploader.md)
- Data registries

## Learn More

- Learn how to [use jsonforms](https://jsonforms.io/) to declaratively build and render your forms.
