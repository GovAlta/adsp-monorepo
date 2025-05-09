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
    <td>
        Limited text
        with required validation
    </td>
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

### Selectors {#target-selectors}

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
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Vertical Layout (columns)</td>
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
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Markdown</td>
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

### File Uploads {#target-uploads}

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

### Repeating Items {#target-lists}

_Repeating Items_ are useful when you need to capture multiple instances of similar information from your applicants. For example, you may want to collect contact information for one or more family members. With the _List with Details_ or _Object Array_ components, users can easily add as many rows as needed to complete the form. For more information on how these components work, please see the section on [Repeating Items](/adsp-monorepo/tutorials/form-service/repeated-items.html).

<table>
  <tr>
    <th>Feature</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>List With Detail</td>
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

### Steppers {#target-steppers}

Steppers allow you to partition your form into one or more steps, so users can focus on one group of questions at a time. For more information on how these components work, please see the section on [steppers](/adsp-monorepo/tutorials/form-service/steppers.html).

<table>
  <tr>
    <th>Feature</th>
    <th>JSON schema</th>
    <th>UI schema</th>
  </tr>
  <tr>
    <td>Categorization</td>
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

### Validation {#target-validation}

Validation is most easily accomplished through the semantics of JSON Schemas. Note the "minLength" attribute of the name property. This is needed to address a fix needed when required string fields.

<table>
  <tr>
    <th>Feature</th>
    <th>JSON schema</th>
  </tr>
  <tr>
    <td>Required</td>
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
