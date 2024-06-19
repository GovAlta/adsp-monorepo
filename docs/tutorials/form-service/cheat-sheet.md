---
title: Cheat Sheet
layout: page
nav_order: 13
parent: Form Service
grand_parent: Tutorials
---

## Cheat Sheet

Use the cheat sheet to determine how you could configure the _data and UI schemas_ to render specific form elements. Note: in some UI schemas you will see "ComponentProps" in the options element. Component props are passed directly to the underlying _Design Systems components_ to alter their behaviour. See [their documentation](https://design.alberta.ca/components) for a complete list of properties that can be managed this way.

### Constrained Selections

For when the user must select from a limited set of answers.

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
  "label": "What's your favorite colour?",
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
  "label": "What's your favorite colour?",
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
  <tr>
    <td>Checkbox</td>
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
  "label": "What are your favorite colours?",
  "options": {
    "format": checkbox,
    "componentProps": {
      "orientation": "vertical"
    }
  }
}
    </code></pre></td>
  </tr>
</table>

### File Uploads

For when the user needs to upload supporting documentation. For a more complete description of file uploads, see [the documentation](/adsp-monorepo/tutorials/form-service/file-uploader.md).

<table>
  <tr>
    <th>Feature</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Upload a File</td>
    <td><pre><code>
{
  "certificate": {
    "type": "string",
    "format": "file-urn"
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/certificate",
  "options": {
    "variant": "dragdrop"
  }
}
    </code></pre></td>
  </tr>
</table>

### Common data formats

Here are some out-of-the-box formats that not only render with the correct input widget, but ensure that the data provided by users is valid.

<table>
  <tr>
    <th>Format</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Date</td>
    <td><pre><code>
{
  "dateOfBirth": {
    "type": "string",
    "format": "date"
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/dateOfBirth",
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Integer</td>
    <td><pre><code>
{
  "numberOfChildren": {
    "type": "string",
    "format": "integer"
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/numberOfChildren",
  "options": {
    "componentProps": {
      "min": 10,
      "max": 200,
      "step": 5
    }
  }
}
    </code></pre></td>
  </tr>
    <tr>
    <td>Number</td>
    <td><pre><code>
{
  "averageYearlyRainfall": {
    "type": "string",
    "format": "number"
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/averageYearlyRainfall"
}
    </code></pre></td>
  </tr>
    <tr>
    <td>Limited Text</td>
    <td><pre><code>
{
  "firstName": {
    "type": "string"
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/firstName"
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Text Box</td>
    <td><pre><code>
{
  "reasonForApplying": {
    "type": "string"
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/reasonForApplying"
  "options": {
  "multi": true,
  "componentProps": {
    "rows": 10,
    "placeholder": "multi line input"
    }
  }
}
    </code></pre></td>
  </tr>
</table>
