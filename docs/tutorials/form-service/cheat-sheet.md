---
title: Cheat Sheet
layout: page
nav_order: 13
parent: Form Service
grand_parent: Tutorials
---

## Cheat Sheet

Use the cheat sheet to determine how you could configure the _data and UI schemas_ to render specific form elements.

Note: in some UI schemas you will see "ComponentProps" in the options element. Component props are passed directly to the underlying _Design Systems components_ to alter their behaviour, See [their documentation](https://design.alberta.ca/components) for a complete list of properties that can be managed this way.

### TOC

- [Common Data Formats](#target-common-formats)
- [Selectors](#target-selectors)
- [Form Layout](#target-layout)
- [Instructional Content](#target-instructions)
- [File Uploads](#target-uploads)
- [Repeating Items](#target-lists)
- [Steppers](#target-steppers)
- [Validation](#target-validation)

### Common data formats {#target-common-formats}

Here are some out-of-the-box formats that not only render with the correct input widget, but ensure that the data provided by users is valid. NOTE: There is a known issue in jsonforms that allows an empty string to satisfy the required validation rule. To work around this, you should also add a minimum length of 1 to required string fields (see Limited text with required validation) below.

<table>
  <tr>
    <th>Format</th>
    <th>Description</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Date</td>
    <td>A calendar date picker for selecting a date value in ISO format (YYYY-MM-DD).</td>
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
    <td>Date (past dates only)</td>
    <td>A date picker restricted to only allow selection of dates in the past (before today).</td>
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
  "options": {
    "allowPastDate": true,
    "allowFutureDate": false
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Date (future dates only)</td>
    <td>A date picker restricted to only allow selection of dates in the future (after today).</td>
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
  "options": {
    "allowPastDate": false,
    "allowFutureDate": true
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Integer</td>
    <td>A numeric input field for whole numbers with optional min, max, and step constraints.</td>
    <td><pre><code>
{
  "numberOfChildren": {
    "type": "integer"
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
    <td>A numeric input field for decimal and floating-point values.</td>
    <td><pre><code>
{
  "averageYearlyRainfall": {
    "type": "number"
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
      <td>Calculation (computed)</td>
      <td>A read-only calculated field that evaluates a numeric expression from other form values and writes the result back into form data.</td>
      <td><pre><code>
  {
    "total": {
      "type": "string",
      "format": "computed",
      "description": "#/properties/x * #/properties/y + #/properties/z"
    }
  }
      </code></pre></td>
      <td><pre><code>
  {
    "type": "Control",
    "scope": "#/properties/total",
    "label": "Total"
  }
      </code></pre></td>
    </tr>
  <tr>
    <td>Limited Text</td>
    <td>A single-line text input field with character limit.</td>
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
    <td>Text populated from the logged-in user</td>
    <td>
      An empty text field populated from the logged-in user's profile. Set
      <code>autoPopulate</code> to <code>firstName</code>, <code>lastName</code>, or
      <code>email</code>. Fields without this UI-schema option are not populated.
    </td>
    <td><pre><code>
{
  "applicantGivenName": {
    "type": "string"
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/applicantGivenName",
  "options": {
    "autoPopulate": "firstName"
  }
}
    </code></pre></td>
  </tr>
   <tr>
    <td>
        Limited text
        with required validation
    </td>
    <td>A required single-line text input that cannot be empty and must contain at least one character.</td>
    <td>
    <pre><code>
{
  "firstName": {
    "type": "string",
    "minLength" : 1
  },
  "required" : [
    "firstName"
    ]
}
    </code></pre>
    </td>
       <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/firstName"
}
    </code></pre></td>

  </tr>
  <tr>
    <td>Text Box</td>
    <td>A multi-line text input field for longer text content with configurable row height.</td>
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
  <tr>
    <td>Text Box with required validation</td>
    <td>A required multi-line text field that must contain at least one character.</td>
    <td><pre><code>
{
  "reasonForApplying": {
    "type": "string",
    "minLength" : 1
  },
  "required" : [
     "reasonForApplying"
  ]
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
  <tr>
    <td>Boolean (yes,no)</td>
    <td>A radio button group for selecting between two options (typically Yes/No).</td>
    <td><pre><code>
{
  "isOver18": {
    "type": "boolean"
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "scope": "#/properties/isOver18"
  "label": "Are you over 18 years of age?",
  "options": {
    "format": "radio",
    "textForTrue": "Yes",
    "textForFalse": "No"
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Checkbox with required validation</td>
    <td>A required checkbox that must be checked (confirmed) to satisfy the form requirement.</td>
    <td><pre><code>
{
  "iDeclare": {
    "type": "boolean",
    "allOf": [
      {
        "enum": [
          true
        ]
      }
    ]
  },
  "required" : [
    "ideclare"
  ]
}
    </code></pre></td>
    <td><pre>
    <code>
{
  "type": "Control",
  "scope": "#/properties/iDeclare"
  "options":{
    text: "I declare the information is correct to the best of my knowledge"
  }
}
</code></pre></td>

  </tr>

</table>

#### Date Input Control Options

The date control supports these options to restrict date selection:

<table>
  <tr>
    <th>Option</th>
    <th>Behavior</th>
    <th>Default</th>
  </tr>
  <tr>
    <td><code>allowPastDate</code></td>
    <td>When set to <code>true</code> with <code>allowFutureDate: false</code>, restricts the date picker to only allow selection of past dates (before today).</td>
    <td>Not set</td>
  </tr>
  <tr>
    <td><code>allowFutureDate</code></td>
    <td>When set to <code>true</code> with <code>allowPastDate: false</code>, restricts the date picker to only allow selection of future dates (after today).</td>
    <td>Not set</td>
  </tr>
</table>

#### Calculation Control

The calculation control is rendered when the JSON schema field uses <code>"format": "computed"</code>. The expression is defined in <code>schema.description</code>, evaluated against current form data, and the result is written back to the control path automatically. The rendered field is read-only.

##### Calculation Requirements

<table>
  <tr>
    <th>Property</th>
    <th>Location</th>
    <th>Behavior</th>
  </tr>
  <tr>
    <td><code>format</code></td>
    <td><code>JSON schema</code></td>
    <td>Must be set to <code>computed</code> for the calculation renderer to be selected.</td>
  </tr>
  <tr>
    <td><code>description</code></td>
    <td><code>JSON schema</code></td>
    <td>Contains the calculation expression. This is where the library reads the formula from.</td>
  </tr>
  <tr>
    <td><code>scope</code></td>
    <td><code>UI schema</code></td>
    <td>Points to the destination field where the computed result is stored.</td>
  </tr>
  <tr>
    <td><code>label</code></td>
    <td><code>UI schema</code></td>
    <td>Optional display label for the read-only calculated field.</td>
  </tr>
</table>

##### Supported Calculation Patterns

<table>
  <tr>
    <th>Pattern</th>
    <th>Description</th>
    <th>Example Expression</th>
  </tr>
  <tr>
    <td>Arithmetic with scopes</td>
    <td>Uses referenced form values in numeric expressions.</td>
    <td><code>#/properties/x * #/properties/y + #/properties/z</code></td>
  </tr>
  <tr>
    <td><code>SUM(...)</code></td>
    <td>Sums a numeric property across all rows of an object array.</td>
    <td><code>SUM(#/properties/items/amount)</code></td>
  </tr>
  <tr>
    <td><code>min(...)</code></td>
    <td>Returns the smallest numeric value from referenced scopes and/or literals.</td>
    <td><code>min(#/properties/a, #/properties/b, 100)</code></td>
  </tr>
  <tr>
    <td><code>max(...)</code></td>
    <td>Returns the largest numeric value from referenced scopes and/or literals.</td>
    <td><code>max(#/properties/a, #/properties/b, 0)</code></td>
  </tr>
</table>

##### Calculation Examples

**Basic arithmetic**

```json
{
  "type": "object",
  "properties": {
    "x": {
      "type": "number"
    },
    "y": {
      "type": "number"
    },
    "z": {
      "type": "number"
    },
    "total": {
      "type": "string",
      "format": "computed",
      "description": "#/properties/x * #/properties/y + #/properties/z"
    }
  }
}
```

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/x"
    },
    {
      "type": "Control",
      "scope": "#/properties/y"
    },
    {
      "type": "Control",
      "scope": "#/properties/z"
    },
    {
      "type": "Control",
      "scope": "#/properties/total",
      "label": "Total"
    }
  ]
}
```

**Sum a numeric column from a repeating-item array**

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "amount": {
            "type": "number"
          }
        }
      }
    },
    "totalAmount": {
      "type": "string",
      "format": "computed",
      "description": "SUM(#/properties/items/amount)"
    }
  }
}
```

```json
{
  "type": "VerticalLayout",
  "elements": [
    {
      "type": "ListWithDetail",
      "scope": "#/properties/items",
      "options": {
        "detail": {
          "type": "VerticalLayout",
          "elements": [
            {
              "type": "Control",
              "scope": "#/properties/amount",
              "label": "Amount"
            }
          ]
        }
      }
    },
    {
      "type": "Control",
      "scope": "#/properties/totalAmount",
      "label": "Total amount"
    }
  ]
}
```

**Clamp to a minimum or maximum value**

```json
{
  "type": "object",
  "properties": {
    "requested": {
      "type": "number"
    },
    "approved": {
      "type": "string",
      "format": "computed",
      "description": "min(#/properties/requested, 1000)"
    }
  }
}
```

##### Calculation Behavior and Errors

<table>
  <tr>
    <th>Case</th>
    <th>Behavior</th>
  </tr>
  <tr>
    <td>All referenced values missing</td>
    <td>The field stays blank and no error is shown.</td>
  </tr>
  <tr>
    <td>Some referenced values missing</td>
    <td>The field stays blank and shows <code>Please provide values for: ...</code> after the user has interacted with the form.</td>
  </tr>
  <tr>
    <td>Invalid scope in the expression</td>
    <td>A configuration error is shown for the bad scope reference.</td>
  </tr>
  <tr>
    <td>Invalid expression syntax</td>
    <td>A configuration error is shown with <code>Invalid expression syntax</code>.</td>
  </tr>
  <tr>
    <td>Non-numeric values in <code>SUM(...)</code></td>
    <td>The calculation does not produce a value and asks for valid values for the referenced array column.</td>
  </tr>
</table>

##### Notes

- The library selects this control for schema fields with <code>type: "string"</code> and <code>format: "computed"</code>.
- Even though the schema type is <code>string</code>, the rendered control is a disabled numeric input and the computed value written back to form data is numeric.
- Scope references should use JSON pointer-style paths such as <code>#/properties/fieldName</code>.

### Selectors {#target-selectors}

For when the user must select from a limited set of answers.

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Dropdown menu</td>
    <td>A collapsed dropdown selector for choosing one option from a predefined list.</td>
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
    <td>A set of radio buttons for selecting one option from a list, with options displayed inline or vertically.</td>
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
    "format": "radio",
    "componentProps": {
      "orientation": "horizontal"
    }
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Checkbox</td>
    <td>A set of checkboxes for selecting multiple options from a list simultaneously.</td>
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

### Form Layout {#target-layout}

Layouts let you organize input fields they way you want them. You can lay out the fields in rows (horizontally), in columns (vertically), or in a mixture of both.

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Vertical Layout (columns)</td>
    <td>Arranges input fields vertically (stacked on top of each other) in a single column.</td>
    <td><pre><code>
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
    </code></pre></td>
    <td><pre><code>
{
  "type": "VerticalLayout",
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
    </code></pre></td>
  </tr>
  <tr>
    <td>Horizontal Layout (rows)</td>
    <td>Arranges input fields horizontally (side by side) in a single row.</td>
    <td><pre><code>
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
    </code></pre></td>
    <td><pre><code>
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
    </code></pre></td>
  </tr>
  <tr>
    <td>Mixed</td>
    <td>Combines vertical and horizontal layouts to create complex field arrangements with multiple rows and columns.</td>
    <td><pre><code>
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "reasonForLeaving": {
      "type": "string"
    }
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "VerticalLayout",
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
    },
    {
      "type": "Control",
      "scope": "#/properties/reasonForLeaving",
      "options": {
        "multi": true
      }
    },
  ]
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Groups</td>
    <td>Groups related input fields together with a label, visually organizing related information.</td>
    <td><pre><code>
{
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "initial": {
      "type": "string",
      "maxLength": 1
    }
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "Group",
  "label": "Group Name",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/firstName"
    },
    {
      "type": "Control",
      "scope": "#/properties/lastName"
    },
    {
      "type": "Control",
      "scope": "#/properties/initial"
    },
  ]
}
    </code></pre></td>
  </tr>
</table>

### Instructional Content {#target-instructions}

For when you need to add instructions, or help, to guide users when they are filling out a form. Instructions can be rendered in text, as hyperlinks, or with images. See the [section on help text](/adsp-monorepo/tutorials/form-service/instructions.html) for more information.

Note: the optional labels are used as paragraph headings, when so desired. Nesting paragraphs (see below) can be used to generate subparagraphs, with appropriately sized subheadings. You can nest up to 3 levels.

As of **Jan. 2025** you can use markdown for help content, significantly simplifying the process of adding help text. Please see the [section on help text](/adsp-monorepo/tutorials/form-service/instructions.html).

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Markdown</td>
    <td>Renders instructional content using Markdown syntax, supporting bold, italic, links, bullet points, and section headings.</td>
    <td>N/A</td>
    <td><pre><code>
{
  "type": "HelpContent",
  "label": "Paragraph Heading (bold, H2)",
  "options": {
    "markdown": true,
    "help": [
    "## Section Heading",
    "This is a paragraph with some **bold** text.",
    "This is another paragraph, with _italic_ text.",
    "This paragraph has [a link](https://google.com)."
    "- First bullet point",
    "- Second bullet point"
    ]
  }
}
    </code></pre></td>
  </tr>

  <tr>
    <td>Paragraph</td>
    <td>Displays a plain text paragraph with optional heading label for instructional content.</td>
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
    <td>Organizes multiple paragraphs hierarchically with parent and child heading levels (up to 3 levels deep).</td>
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
    <td>Displays a list of bullet points, useful for presenting multiple related items or steps.</td>
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
    <td>Creates a collapsible section (accordion) with a title that users can click to reveal detailed content.</td>
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
    <td>Displays a large primary heading (H2) for section titles in instructional content.</td>
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
    <td>Displays a smaller secondary heading (H3) for subsections within instructional content.</td>
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
    <td>Embeds an image in the form with configurable dimensions, alt text, and source URL.</td>
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
    <td>Creates a clickable link to an external URL with custom link text.</td>
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

### File Uploads {#target-uploads}

For when the user needs to upload supporting documentation. For a more complete description of file uploads, see [the documentation](/adsp-monorepo/tutorials/form-service/file-uploader.md).

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Upload a File</td>
    <td>Allows users to upload a file via drag-and-drop or file selection interface, storing a file URN reference.</td>
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

#### FileUploader Control Options

The FileUploader Control supports these options to configure file upload behavior:

<table>
  <tr>
    <th>Option</th>
    <th>Location</th>
    <th>Behavior</th>
    <th>Default</th>
  </tr>
  <tr>
    <td><code>maximum</code></td>
    <td><code>componentProps.maximum</code></td>
    <td>Set a limit on how many files can be uploaded for the control. Prevents users from uploading more than the specified number of files.</td>
    <td><code>1</code></td>
  </tr>
  <tr>
    <td><code>noDownloadButton</code></td>
    <td><code>format.noDownloadButton</code></td>
    <td>When set to <code>true</code>, hides the download button in the file list, preventing users from downloading uploaded files.</td>
    <td><code>false</code></td>
  </tr>
</table>

##### FileUploader Control Options Examples

**Multiple file uploads with no download button:**

```json
{
  "type": "Control",
  "scope": "#/properties/supportingDocuments",
  "options": {
    "variant": "dragdrop",
    "componentProps": {
      "maximum": 5
    },
    "format": {
      "noDownloadButton": true
    }
  }
}
```

**Single file upload with download enabled:**

```json
{
  "type": "Control",
  "scope": "#/properties/certificate",
  "options": {
    "variant": "dragdrop",
    "componentProps": {
      "maximum": 1,
      "maxFileSize": "5MB",
      "accept": ".pdf,.doc,.docx"
    }
  }
}
```

### Repeating Items {#target-lists}

_Repeating Items_ are useful when you need to capture multiple instances of similar information from your applicants. For example, you may want to collect contact information for one or more family members. With the _List with Details_ or _Object Array_ components, users can easily add as many rows as needed to complete the form. For more information on how these components work, please see the section on [Repeating Items](/adsp-monorepo/tutorials/form-service/repeated-items.html).

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>List With Detail</td>
    <td>Displays array items in a list view with the ability to click and edit detailed information for each item.</td>
    <td><pre><code>
{
  "type": "object",
  "properties": {
    "Users": {
      "type": "array",
      "items": {
        "type": "object",
        "title": "Users",
        "properties": {
          "firstname": {
            "type": "string"
          },
          "lastname": {
            "type": "string"
          }
        }
      }
    }
  }
}
    </code></pre></td>
    <td><pre><code>
{
  "type": "ListWithDetail",
  "scope": "#/properties/Users",
  "options": {
    "detail": {
      "type": "VerticalLayout",
      "elements": [
        {
          "type": "HorizontalLayout",
          "elements": [
            {
              "type": "Control",
              "scope": "#/properties/firstname",
              "label": "First Name"
            },
            {
              "type": "Control",
              "scope": "#/properties/lastname",
              "label": "Last Name"
            }
          ]
        }
      ]
    }
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td>Object Array</td>
    <td>Displays array items in an inline table format where each row can be expanded for individual editing.</td>
    <td><pre><code>
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
    </code></pre></td>
    <td><pre><code>
{
  "type": "Control",
  "label": "People",
  "scope": "#/properties/people"
}
    </code></pre></td>
  </tr>
</table>

#### Repeating Items Control Options

The repeating item controls support this array-list option:

<table>
  <tr>
    <th>Option</th>
    <th>Location</th>
    <th>Behavior</th>
    <th>Default</th>
  </tr>
  <tr>
    <td><code>showArrayTableSortButtons</code></td>
    <td><code>options.showArrayTableSortButtons</code></td>
    <td>Enables the array sort-button setting for repeating item controls.
    <td><code>false</code></td>
  </tr>
</table>

##### Repeating Items Control Option Example

```json
{
  "type": "ListWithDetail",
  "scope": "#/properties/people",
  "options": {
    "showArrayTableSortButtons": true,
    "detail": {
      "type": "VerticalLayout",
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
  }
}
```

### Steppers {#target-steppers}

Steppers allow you to partition your form into one or more steps, so users can focus on one group of questions at a time. For more information on how these components work, please see the section on [steppers](/adsp-monorepo/tutorials/form-service/steppers.html).

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Categorization</td>
    <td>Partitions form fields into multiple categories/steps that users navigate through sequentially, with automatic summary review page.</td>
    <td><pre><code>
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
    </code></pre></td>
    <td><pre><code>
{
  "type": "Categorization",
  "elements": [
    {
      "type": "Category",
      "label": "First Name,
      "elements": [
        {
          "type": "Control",
          "scope": "#/properties/firstName
        }
      ]
    },
    {
      "type": "Category",
      "label": "Last Name,
      "elements": [
        {
          "type": "Control",
          "scope": "#/properties/last
        }
      ]
    }
  ]
}
    </code></pre></td>
  </tr>
</table>

Page steppers support these Task List and review-flow options:

<table>
  <tr>
    <th>Attribute</th>
    <th>Description</th>
    <th>Scope</th>
    <th>Example</th>
  </tr>
  <tr>
    <td><code>hideSummary</code></td>
    <td>Hide the Summary row on the Task List and skip the summary review page.</td>
    <td><code>Categorization.options</code></td>
    <td><pre><code>
{
  "type": "Categorization",
  "options": {
    "hideSummary": true
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td><code>hideSubmit</code></td>
    <td>Hide the Submit button on the summary review page.</td>
    <td><code>Categorization.options</code></td>
    <td><pre><code>
{
  "type": "Categorization",
  "options": {
    "hideSubmit": true
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td><code>toAppOverviewLabel</code></td>
    <td>Change the back-link text that returns the user to the Task List.</td>
    <td><code>Categorization.options</code></td>
    <td><pre><code>
{
  "type": "Categorization",
  "options": {
    "toAppOverviewLabel": "Back to task list"
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td><code>sectionTitle</code></td>
    <td>Group categories under a section heading on the Task List.</td>
    <td><code>Category.options</code></td>
    <td><pre><code>
{
  "type": "Category",
  "options": {
    "sectionTitle": "The parties"
  }
}
    </code></pre></td>
  </tr>
  <tr>
    <td><code>showInTaskList</code></td>
    <td>When set to <code>false</code>, hide the category from the Task List. Hidden categories do not render their own row, and a section header is not shown if all categories in that section are hidden.</td>
    <td><code>Category.options</code></td>
    <td><pre><code>
{
  "type": "Category",
  "label": "What are their contact details?",
  "options": {
    "sectionTitle": "The parties",
    "showInTaskList": false
  }
}
    </code></pre></td>
  </tr>
</table>

### Validation {#target-validation}

Validation is most easily accomplished through the semantics of JSON Schemas. Note the "minLength" attribute of the name property. This is needed to address a fix needed when required string fields.

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
    <th>JSON schema</th>
  </tr>
  <tr>
    <td>Required</td>
    <td>Ensures that specified fields must have a value provided before form submission.</td>
    <td><pre><code>
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "isAlbertan": {
      "type": "boolean"
    }
  },
  "required": [
    "firstName",
    "lastName"
  ]
}
    </code></pre></td>
  </tr>
    <tr>
    <td>Conditionally Required</td>
    <td>Makes a field required based on conditions defined in other field values using if-then logic.</td>
    <td><pre><code>
{
  "type": "object",
  "properties": {
    "hasChild": {
      "type": boolean
    },
    "childsName": {
      "type": "string",
    },
  },
  "required": [
    "hasChild"
  ],
  "if": {
    "properties": {
      "hasChild": {
        "const": true
      }
    }
  },
  "then": {
    "properties": {
      "childsName": {
      "minLength": 1
      }
    },
    "required": [
      "childsName"
    ]
  }
}
    </code></pre></td>
  </tr>
</table>
