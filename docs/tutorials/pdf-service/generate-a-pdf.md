---
title: Generate a PDF
layout: page
nav_order: 5
parent: PDF Service
grand_parent: Tutorials
---

## Getting Started

The PDF Service allows you to automatically build a customized PDF document from an HTML template and some template variables. You can use the PDF Service's [Template Editor](/adsp-monorepo/templates/pdf/building-a-template.html) to build one interactively, and once it's in the system you can start using it in your application to generate downloadable PDF documents for your end users.

PDF generation is accomplished through a series of API calls that create the PDF and store it within the [File Service](/adsp-monorepo/services/file-service.html), where you have access to it through a file ID. The main steps are:

- Authenticate your application and get an access token from Keycloak,
- Initiate an asynchronous Job to generate the PDF and store it in the File Service,
- Get the File ID when the job is complete,
- present the PDF to your end user for downloading, as required

Although you can call the API's from any language, the tutorial examples are written in Node.js. Familiarity with the latter (or Javascript) is desirable, but not absolutely necessary.

The API calls to the Platform Service require authentication, via Keycloak. See the instructions for [setting up a tenant and getting access tokens](/adsp-monorepo/tutorials/access-service/introduction.html) for details on how to do this.

Continuing on from the tutorial on how to [build a template](/adsp-monorepo/tutorials/building-a-template.html) with the PDF service, our examples will be based on the template set up there for the Child Service's Intervention Record Check. Familiarity with that particular template is not necessary to follow along here, but the information will be useful if you want to understand how the pieces relate to each other.

See the [PDF Service](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=PDF%20service) Swagger documentation for detailed descriptions of the APIs.

## Submit a PDF Generator Job

Generating a PDF is an expensive operation and can take up to several seconds, depending on its size.  For this reason the operation is submitted to a Job Queue and performed asynchronously.  To submit a job you need to specify:

- the template ID
- a file name, and
- a File Type collection (optional)

The template ID can be seen in your template editor while you are developing it.

![](/adsp-monorepo/assets/pdf/templateId.png)

You supply the filename, which should be something that uniquely identifies the new PDF document.

The _File Type_ collection lets you manage access permissions to your PDF files. By default the File Type is _Generated PDF_, which has the correct permissions for the PDF Service to access files. When using your own File Type it is _very important_ to give the correct permissions to these files. At a minimum you must grant read permission to _Urn:Ads:Platform:Pdf-Service:Pdf-Generator_ and write permission to _Urn:Ads:Platform:Tenant-Service:Platform-Service_. See the [File Service](/adsp-monorepo/services/file-service.html) for information on how to create a new File Type collections and grant permissions.

The request body for generating a new PDF will look something like this:

```typescript
const request = {
  operation: 'generate',
  templateId: 'intervention-record-check',
  filename: 'bobs-intervention-record-check.pdf',
  data: ircData,
};
```

where ircData is a Json object containing the data collected by the application to use for variable substitutions. Note, the test data for our tutorial can be
<a href="/adsp-monorepo/assets/pdf/test_data.json" download>downloaded here</a>.

Generate the PDF file by submitting a Job

```typescript
const response = await fetch('https://pdf-service.adsp.alberta.ca/pdf/v1/jobs', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

which places the request on the job queue and returns:

```typescript
const { urn, id, status } = await response.json();
```

where

- _id_ is a unique ID identifying the job spawned to generate your PDF,
- _status_ is the job status, and can take on one of three values; _queued_, _completed_, or _failed_. Initially it will be set to _queued_,
- _urn_ is the [Universal Resource Name](https://en.wikipedia.org/wiki/Uniform_Resource_Name) of the Job that you can use along with the [Directory Service](/adsp-monorepo/services/directory-service.html) to lookup the URL to use for polling its status.

## Test for Job Completion

Depending on the complexity of your template, the job can take up to several seconds to complete. As the Job progresses the status will change from _queued_ to _completed_. You can poll the Job status to see when it has completed, or, use the Platform's [Push Service](/adsp-monorepo/services/push-service.html).

Polling is done using GET /pdf/v1/jobs/{jobID} to see if the returned status is _completed_. The API will return a structure of the form

```typescript
{
    urn,
    id,
    status,
    result: { urn, id, filename }
}
```

where the first three properties are as described above, and the _result_ property contains:

- _id_ the id of the PDF file generated, which can be used to access the file along with the [File Service](/adsp-monorepo/services/file-service.html)
- _filename_ the name of the file generated
- _urn_ the [Universal Resource Name](https://en.wikipedia.org/wiki/Uniform_Resource_Name) of the PDF file that you can use along with the [File Service](/adsp-monorepo/services/directory-service.html) to lookup the URL to use for downloading it.

Polling forces the application developer to manage retrying and sleeping between tries, however. A less fussy approach would be to use the [Push Service](/adsp-monorepo/services/push-service.html). It enables applications to connect to a socket and listen for events of a specific type, such as "pdf-generated". The latter occurs when a Job successfully creates a PDF. You can connect to a Push Service socket as follows:

```typescript
import { io } from 'socket.io-client';

const socket = io(
    `https://push-service.adsp.alberta.ca/${tenantId}?stream=pdf-generation-updates`,
    {  withCredentials: true,
       extraHeaders: {
         Authorization: `Bearer ${accessToken}` }
    }
);

socket.on('pdf-service:pdf-generated', (pdfEvent) => {
  If (pdfEvent.jobId === jobID ) {
        // Handle the event.
  }
});
```

The listener will pick up on all pdf-generated events for your tenant, so you will want to look for the one with the specific JobID. A pdfEvent has the form:

```typescript
{
    jobId,
    templateId,
    file: { id, filename, urn },
    requestedBy
}
```

Whichever method you use, the important part is the file ID you get upon successful generation. This identifies the PDF document in the [File Service](/adsp-monorepo/services/file-service.html) which you can use to access it. Job information is cached and has a finite TTL of about 12 hours. Please be sure your application accesses the file ID before the job information expires.

## Download a PDF File

The file can be downloaded via

```typescript
await fetch(`https://file-service.adsp.alberta.ca/file/v1/files/${fileID}/download`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

## Learn More

- Learn how to [build a PDF template](/adsp-monorepo/tutorials/pdf-service/building-a-template.html) using ADSP's Template Editor
