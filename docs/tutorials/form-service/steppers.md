---
layout: page
title: Steppers
parent: Form Service
grand_parent: Tutorials
nav_exclude: false
---

# Form Steppers

With large, complex, forms it can sometimes be a challenge for users to navigate through the questions and keep track of their answers. One way to mitigate this problem is to organize a form into logical chunks. Each chunk (called a page, or a step) is used to present one or more questions for the user answer. User are provided means to:

- navigate between chunks,
- track their progress on filling out the form, and
- see a summary of their answers

The _Form Service_ provides two implementations of a stepper; a _page stepper_, and a _simple stepper_. Although the look and feel of each type is quite different, the JSON Schema descriptions of each are practically identical and you can move from one to the other with a simple flip of a switch.

## Page Steppers

Page steppers - now the [Design System's preferred method](https://design.alberta.ca/patterns/public-form) for managing complex forms - treat a form as a series of pages and include a _Task List_ (table of contents) at the start, e.g.

![](/adsp-monorepo/assets/form-service/task-list.png){: width="400" }

The _Task List_ page allows users to see the status of their application, and the status of each page, at a glance. They can enter the application at any stage and continue the application from where they left off.

## Simple Steppers

Simple Steppers have the dubious advantage of allowing the user to navigate anywhere from any page. This ease of use comes with a price; the step navigation takes up a lot of real estate, and will sometimes confuse end users. However, it is a common pattern for complex forms and is implemented by the form service. Here's an example:

![](/adsp-monorepo/assets/form-service/formAppExample.png){: width="800" }

User's can see at a glance where they are in the overall form structure, and the status of each page. If the form is not too complex and the end users are experienced then a Simple Stepper might be the right choice.

The underlying technology for Simple Steppers is the [Design System's stepper](https://design.alberta.ca/components/form-stepper#tab-0) coupled with the conventions used with Jsonforms for steppers.

## Implementation

Pages (or steps) are defined through categories in the _UI Schema_. You initially declare your intent to organize you questions into pages with the _Categorization_ element.

```json
{
  "type": "Categorization",
  "options": {
    "variant": "pages",
    "title": "Tutorial Example",
    "subtitle": "Tell us who you are"
  }
  "elements": []
}
```

The variant can be either _pages_ or _stepper_.

Each page element is called a _category_. For example, here's a simple schema that could be used to collect a user's name and address information;

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

It's a bit of overkill, but for illustrative purposes we'll put the name and address fields into separate steps, like so:

```json
{
  "type": "Categorization",
  "options": {
    "variant": "pages",
    "title": "Tutorial Example",
    "subtitle": "Tell us who you are"
  },
  "elements": [
    {
      "type": "Category",
      "label": "Name",
      "options": {
        "sectionTitle": "Identification"
      },
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
      "options": {
        "sectionTitle": "Residence"
      },
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
  ]
}
```

Which yields:

![](/adsp-monorepo/assets/form-service/tutorial-example
.png){: width="400" }

Notice that

- The Categorization has two Categories labeled _Name_ and _Address_. This grouping tells the rendering engine to create a stepper with 2 pages.
- The Categorization element has an _options variant_ set to _pages_. For a simple stepper you would set it to _stepper_.
- A _Category_ element can have an optional "sectionTitle", which is used to group one ore more categories into a section. Sections only appear on the task list, and are used solely for organization purposes. There is no equivalent concept for the _simple steppers_.
- Everything else is declared as it would be without the stepper.
- There is an extra page added to the stepper, called _Summary_. This is a GOA added feature that lets the applicant quickly review the data they have entered before final submission.

![](/adsp-monorepo/assets/form-service/summary-page.png){: width="400" }
