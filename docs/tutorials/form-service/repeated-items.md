---
title: Form Lists
layout: page
parent: Form Service
grand_parent: Tutorials
nav_exclude: false
---

# Form lists

There are two types of _repeated items_ in Jsonforms; the _list with details_, and the _object array_. The latter is a simple, sequential list of items ordered by time of entry. This is useful if the number of items is expected to be small or if each item contains a small number of elements. However, it may become unwieldy as the number grows larger, and this is where the _list with details_ comes into its own. It contains a simple means to navigate through the list, and displays one item at a time:

## Object Array

Object arrays are the easiest _form lists_ to build declaratively, and are _ideal_ for small sets of data such as contact information. Here's an example:

```json
{
  "type": "object",
  "properties": {
    "people": {
      "type": "array",
      "items": {
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
    }
  }
}
```

This schema declares an array of firstName/lastName pairs to be collected in a form. The corresponding UI schema is;

```json
{
  "type": "Control",
  "label": "People",
  "scope": "#/properties/people"
}
```

resulting in:

![](/adsp-monorepo/assets/form-service/objectArrayExample.png){: width="400" }

Notice how simple the UI-schema is. You just point a control to the json-schema of the object in the array to be rendered. The control makes formatting assumptions, and in this case each property on an item is rendered as a separate row on a card. The list of such cards will quickly become large and difficult to navigate, and because the scope points to an object (_people_ in this example) you loose control over the layout. For complex objects with several, or nested, fields this can be an issue. The formatting assumptions my not be what the designer desires.

## List with Details

For more complex data however, the _list with detail_ is a more appropriate choice. You get the benefits of an object list but still retain full control over how the list item is rendered. Using the same JSON schema as the example above, here's how the corresponding UI schema might look:

```json
{
  "type": "ListWithDetail",
  "scope": "#/properties/people",
  "options": {
    "detail": {
      "elements": [
        {
          "type": "HorizontalLayout",
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
      ]
    }
  }
}
```

Notice that the layout instructions are in the options/detail part of the _ListWithDetail_ schema.

![](/adsp-monorepo/assets/form-service/listWithDetailExample.png){: width="400" }
