---
title: Cheat Sheet
layout: page
nav_order: 13
parent: Form Service
grand_parent: Tutorials
---

## Cheat Sheet

Use the cheat sheet to determine how you could configure the _data and UI schemas_ to render specific form elements. Note: in some UI schemas you will see "ComponentProps" in the options element. Component props are passed directly to the underlying _Design Systems components_ to alter their behaviour, See [their documentation](https://design.alberta.ca/components) for a complete list of properties that can be managed this way.

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

### Selectors

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

### Instructional Content

For when you need to add instructions, or help, to guide users when they are filling out a form. Instructions can be rendered in text, as hyperlinks, or with images. See the [section on help text](/adsp-monorepo/tutorials/form-service/instructions.html) for more information.

Note: the optional labels are used as paragraph headings, when so desired. Nesting paragraphs (see below) can be used to generate subparagraphs, with appropriately sized subheadings. You can nest up to 3 levels.

<table>
  <tr>
    <th>Feature</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Paragraph</td>
    <td>N/A</td>
    <td><pre><code>
{
  "type": "HelpContent",
  "label": "Paragraph Heading (bold, H2)",
  "options": {
    "help": "Put the paragraph text in here"
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Nested Paragraphs</td>
    <td>N/A</td>
    <td><pre><code>
{
  "type": "HelpContent",
  "label": "Paragraph Heading (bold, H2)",
  "options": {
    "help": "Put the main paragraph text in here."
  },
  "elements": [
    {
      "type": "HelpContent",
      "label": "Secondary Heading (bold, H3)",
      "options": {
        "help": "Put the secondary paragraph text in here."
      }
    }
  ]
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Bullet Points</td>
    <td>N/A</td>
    <td><pre><code>
{
  "type": "HelpContent",
  "elements": [
    {
      "type": "HelpContent",
      "label": "Introductory text",
      "options": {
        "help": [
          "First point...",
          "Second point...",
          "Third point...",
          "Forth point..."
        ]
      }
    }
  ]
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Hide/Show detailed explanations</td>
    <td>N/A</td>
    <td><pre><code>
{
  "type": "HelpContent",
  "label": "Title: Click here to show details",
  "options": {
    "variant": "details"
    "help": "Paragraph preceding the bullet points, below"
  },
  "elements": [
    {
      "type": "HelpContent",
      "options": {
        "help": [
          "First point...",
          "Second point...",
          "Third point..."
        ]
      }
    }
  ]
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Primary heading</td>
    <td>N/A</td>
    <td><pre><code>
{
  "type": "HelpContent",
  "label": "Primary Heading (bold, H2)",
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Secondary heading</td>
    <td>N/A</td>
    <td><pre><code>
{
  "type": "HelpContent",
  "elements": [
    {
        "type": "HelpContent",
        "label": "Secondary Heading (bold, H3)"
    }
  ]
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Image</td>
    <td>N/A</td>
    <td><pre><code>
{
  "type": "HelpContent",
  "label": "An image",
  "options": {
    "variant": "img",
    "width": "200",
    "height": "300",
    "alt": "myImage",
    "src": "https://picsum.photos/200/300"
  }
}
    </code></pre></td>
  </tr>
    <tr>
    <td>Hyperlink</td>
    <td>N/A</td>
    <td><pre><code>
{
  "type": "HelpContent",
  "options": {
    "variant": "hyperlink",
    "link": "https://picsum.photos/200/300",
    "help": "link text goes here"
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
