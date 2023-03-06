---
title: Handlebars
layout: page
nav_order: 3
parent: PDF Service
grand_parent: Tutorials
---

## Introduction

Handlebars are the heart of the PDF service's templates.  They're a powerful templating language that lets users embed keys into their PDF template and then, later, use a JSON structure to map the keys to actual values when generating a document.  The mapping is what allows applications to create customized PDF documents. Designers use HTLM, boiler-plate text, CSS, and handlebar keys to build a template, and the applications gathers together values for each of the template keys.  Used together with a simple API call, applications can build customized PDF documents.

## Usage

Handlebar keys are embedded into the template as text values surrounded by curly braces, e.g.

```
The rain in {{data.country}} lies mainly in the {{data.landmark}}
```

Here we have two handlebar keys; country and landmark.  Notice the keys are prefixed by the data. Identifier.  This is specific to the PDF service's implementation and not part of Handlebars itself.  It is very important to remember to use this prefix, otherwise the substitution of key to value will not occur, and the key will just be ignored in the generated document.

The key-value pairing is specified as a JSON object, e.g.

```
{
    "country":"Spain",
    "landmark": "plain"
}
```

Note that the key value pairing does **not** include the _data._ prefix. A document generated with the above template and key-value pairing will have the following text:

```
The rain in Spain lies mainly in the plain.
```

Although this is a trivial example, it illustrates how simple it is to use Handlebars.  But the package provides much more power than this, and includes the ability to

- Iterate over data in an array
- Conditionally test for the existence of values
- Use nested data

See the [Handlebars Documentation](https://handlebarsjs.com/guide/) for more information.

#### Learn More

- Learn how to [build a sophisticated template](/adsp-monorepo/tutorials/pdf/building-a-template.html) using ADSP's Template Editor
- Learn how to [generate a PDF from a template](/adsp-monorepo/tutorials/pdf/generate-a-pdf.html)
