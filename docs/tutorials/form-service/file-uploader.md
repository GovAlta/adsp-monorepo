---
title: Uploading Files
layout: page
nav_order: 12
parent: Form Service
grand_parent: Tutorials
---

## Uploading Files

Adding a file upload widget is quite straight forward in the _Form Service_, you simply declare the format of the control to be _file-urn_ in the JSON schema, e.g.

```json
{
  "type": "object",
  "properties": {
    "certificateOfOwnership": {
      "type": "string",
      "format": "file-urn",
      "variant": "button"
    }
  }
}
```

In the example above the _button_ variant (the default) is used, which renders as a button labeled _Choose file_. You can also use the _dragdrop_ variant to render a drag and drop widget to upload files, as illustrated:

![](/adsp-monorepo/assets/form-service/dragAndDrop.png)

### Accessing the Files

The uploaded files are stored in our secure Azure Blog storage account. A download link is always available to the applicant through the form itself, and if your reviewers are using the [Task App](/adsp-monorepo/tutorials/task-service/task-app.html) to review an application they can download the documents through the form review page.

However, if you are writing your own Application you can access the files through our [File Service](/adsp-monorepo/tutorials/file-service/introduction.html). In the example above the "certificateOfOwnership" field will be populated with the URN of the file that was uploaded, e.g.

```json
{
  "certificateOfOwnership": "urn:ads:platform:file-service:v1:/files/20b125e5-d7e2-4971-9316-c3829ccd85a8"
}
```

You can use this URN, for example, to parse out the file Id (the UUID) and download it with the following endpoint:

```
https://file/v1/files/<file Id>/download
```
