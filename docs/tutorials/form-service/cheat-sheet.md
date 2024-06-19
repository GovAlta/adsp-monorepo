---
title: Cheat Sheet
layout: page
nav_order: 13
parent: Form Service
grand_parent: Tutorials
---

## Cheat Sheet

The cheat sheet provides a list of common form elements and how you might configure the data and UI schemas to render them in your forms:

<table>
  <tr>
    <th>Feature</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Dropdown menu</td>
    <td><pre><code>
{
  "colour": {
    "type": "string",
    "enum": ["red", "blue", "green"]
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/colour"
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Radio Button</td>
    <td><pre><code>
{
  "colour": {
    "type": "string",
    "enum": ["red", "blue", "green"]
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/colour",
  "options": {
    "radio": true,
    "textForTrue": "Yes",
    "textForFalse": "No",
    "componentProps": {
      "orientation": "horizontal"
    }
  }
}
    </code></pre></td>
  </tr>
</table>
