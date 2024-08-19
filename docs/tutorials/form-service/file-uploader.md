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

### Retrieve and store files from your own file storage

If in the use case where you would need to store and retrieve files from your own defined, file storage
instead of using the [File service](/adsp-monorepo/tutorials/file-service/file-service.html) you can
accomplish this by adding a React Context provided by ADSP Form service and injecting your own custom callback functions.

In order to use the file upload control and be able to setup how and where files are stored and retrieved we
need to add in a Context provided by ADSP as shown below as an example.

```
      <ContextProvider
          fileManagement={{
            fileList: metadata,
            uploadFile: uploadFormFile,
            downloadFile: downloadFormFile,
            deleteFile: deleteFormFile,
          }}
        >
          <JsonForms
            ajv={createDefaultAjv()}
            readonly={false}
            schema={definition.dataSchema}
            uischema={definition.uiSchema}
            data={data}
            validationMode="ValidateAndShow"
            renderers={GoARenderers}
            onChange={onChange}
          />
      </ContextProvider>
```

Under the Context there is a property called fileMangement that contains a few functions that you can add in with your own callback functions to perform upload, download and delete operations.

To see an example of the usage, please goto the [Github repo](https://github.com/GovAlta/adsp-monorepo/blob/main/apps/form-app/src/app/components/DraftForm.tsx)
