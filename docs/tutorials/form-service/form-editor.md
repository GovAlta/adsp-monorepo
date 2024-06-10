---
layout: page
title: Form Editor
parent: Form Service
grand_parent: Tutorials
nav_exclude: false
---

# ADSP's Form Editor

You build forms using the ADSP Form Service's _Form Editor_. Log in to the [Tenant-Management-Webapp](https://adsp-uat.alberta.ca) and select the _form service_. You will see something like this:

![](/adsp-monorepo/assets/form-service/FormDefinition.png){: width="400" }

Add a new _form definition_ to try things out. When you click save to create your form definition you will be brought to the form editor:

![](/adsp-monorepo/assets/form-service/FormEditor.png){: width="600" }

The editor has two components; the editor itself, and the preview. The latter shows you how your form will look to the end users and is useful as a guide when building. Try entering a simple data-schema:

```json
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
```

followed by its corresponding ui-schema:

```json
{
  "type": "HorizontalLayout",
  "label": "Name",
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
```

You will see something like this:

![](/adsp-monorepo/assets/form-service/FormPreview.png){: width="400" }

That's it. Once you learn the basics of building forms through schemas, you'll be able to build some pretty impressive forms for your end-users to fill in.

## Learn More

In addition to the [components included with Jsonforms](https://jsonforms.io/) itself, ADSP has extended the concept with several other, [useful components](/adsp-monorepo/tutorials/form-service/building-forms.html) that includes steppers, help & user guidelines, and the ability to upload files.
