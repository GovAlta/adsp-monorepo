---
layout: page
title: PDF service
nav_order: 15
parent: Services
---

# PDF service

PDF service provides utility PDF operations like generation of PDFs from templates. For a more in-depth description of how the service works, please see the [PDF Tutorial](/adsp-monorepo/tutorials/pdf-service/introduction.html)

## Client roles

client `urn:ads:platform:pdf-service`

| name          | description                                                                                                          |
| :------------ | :------------------------------------------------------------------------------------------------------------------- |
| pdf-admin     | Administrator role for the PDF service. This role grants the ability to create, update, and delete PDF templates.    |
| pdf-generator | Generator role for the PDF service. This role grants the ability to generate PDF files from templates and read jobs. |

Both roles are included in the tenant admin role. Reading templates does not need a role: any authenticated user of the tenant can list and get them.

## Tenancy

Templates and jobs belong to a tenant.

- **Tenant users and service accounts** always act on the tenant of their token. Any `tenantId` query parameter is ignored.
- **Core (platform) users and service accounts** act on the tenant given by the `tenantId` query parameter (for example, `?tenantId=urn:ads:platform:tenant-service:v2:/tenants/{id}`). They must set it when creating, updating, or deleting templates, and when generating PDFs. Without it, listing and getting templates returns only platform templates.
- **Platform versus tenant templates.** The templates available to a tenant combine the tenant's own templates with _platform_ templates configured by ADSP for all tenants. A platform template replaces a tenant template with the same ID, and creating a template with the ID of a platform template responds `409`.
- **Isolation.** A template ID that exists only in another tenant responds `404`. A job of another tenant responds `403`.
- **Role scope.** pdf-admin and pdf-generator can be held in the tenant, or by a core user, for template management and generation. Reading a job (`GET /jobs/{jobId}`) requires pdf-generator in the job's tenant; core users can't read jobs, and should use the job events instead.

## API overview

All endpoints are under `https://pdf-service.adsp.alberta.ca/pdf/v1` and require a bearer token. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Area      | Endpoints                                                                            | Required role                     |
| :-------- | :----------------------------------------------------------------------------------- | :-------------------------------- |
| Templates | `GET /templates`, `GET /templates/{templateId}`                                      | Any authenticated user            |
|           | `POST /templates`, `PATCH /templates/{templateId}`, `DELETE /templates/{templateId}` | pdf-admin                         |
| Jobs      | `POST /jobs`                                                                         | pdf-generator                     |
|           | `GET /jobs/{jobId}`                                                                  | pdf-generator in the job's tenant |

Templates can also be managed directly in the [configuration service](configuration-service.md) under `platform:pdf-service`, or in the tenant admin app. Generated PDFs are downloaded through the [file service](file-service.md); the PDF service has no download endpoint.

## Concepts

### PDF template

_Templates_ represent a standard PDF document with template variables for its contents. A template has a body (`template`), and optional `header`, `footer`, and `additionalStyles` (CSS shared by the body, header, and footer). Content is HTML with [Handlebars](/adsp-monorepo/tutorials/pdf-service/handlebars.html) expressions, evaluated with a context of `{ data }`, so variables look like {% raw %}`{{ data.myProperty }}`{% endraw %}. Templates are stored in the configuration service. The template ID is derived from its name when it is created through the API.

### Job

PDF service generates PDFs asynchronously using a job queue. _Jobs_ represent the state of a generation request:

1. `POST /jobs` checks the template, the role, and the optional file type, then creates a job with status `queued`, puts it on the work queue, and sends `pdf-generation-queued`. It responds with the job straight away.
2. A worker renders the template with the request's `data` using [Puppeteer](/adsp-monorepo/tutorials/pdf-service/puppeteer.html), and uploads the PDF to the [file service](file-service.md). The file name's extension is replaced with `.pdf`, and the file's record ID is the request's `recordId`, or the job ID.
3. When the upload succeeds, the job status changes to `completed` with a `result` that holds the file `id`, `urn`, and `filename`, and `pdf-generated` is sent.
4. If generation fails, the work item may be retried. When it fails without a retry, the job status changes to `failed` and `pdf-generation-failed` is sent with the error.

Job state is kept for about 24 hours after its last update; after that `GET /jobs/{jobId}` responds `404`. The generated file is kept by the file service according to its file type.

### File type

Generated PDFs are uploaded as the `generated-pdf` file type by default. It is readable by pdf-generator, and its files are deleted after 30 days. To keep PDFs longer or control who can read them, create your own file type in the file service and set `fileType` in the request. The PDF service uploads with a platform service account, so the file type needs `urn:ads:platform:tenant-service:platform-service` in its update roles. The service also registers `pdf-template-assets`, an anonymously readable file type for images used in templates.

## Events

The PDF service sends the following domain events under the `pdf-service` namespace. Each event's `correlationId` is the job ID, and its `context` is the request's `context` plus `jobId` and `templateId`.

| Event                   | Description                                                                                     |
| :---------------------- | :---------------------------------------------------------------------------------------------- |
| `pdf-generation-queued` | A generation job was queued. Payload has `jobId`, `templateId`, and `requestedBy`.              |
| `pdf-generated`         | A PDF was generated and uploaded. Payload also has `file` with the `id`, `urn`, and `filename`. |
| `pdf-generation-failed` | A generation job failed. Payload has `jobId`, `templateId`, `requestedBy`, and `error`.         |

These events are available on the [push service](push-service.md) stream `pdf-generation-updates`, for subscribers with the pdf-generator role. The PDF service doesn't consume events from other services.

## Code examples

### Configure a template

Users with the pdf-admin role can create a template. The ID is derived from the name, so this creates `submission-summary`.

{% raw %}

```typescript
const response = await fetch('https://pdf-service.adsp.alberta.ca/pdf/v1/templates', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Submission summary',
    description: 'Provides a summary of the submission',
    // HTML with handlebars template string
    template: '<p>Submitted by {{ data.applicant.name }}</p>',
  }),
});

const { id } = await response.json();
```

{% endraw %}

Templates can also be configured using the [configuration service](configuration-service.md).

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';
const request = {
  operation: 'UPDATE',
  update: {
    'submission-summary': {
      id: 'submission-summary',
      name: 'Submission summary',
      description: 'Provides a summary of the submission',
      // HTML with handlebars template string
      template,
    },
  },
};

await fetch(`${configurationServiceUrl}/configuration/v2/configuration/platform/pdf-service`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

### Create a PDF generation job

Generated PDFs are uploaded to the [file service](file-service.md) and the _file type_ used can be specified in the request. This allows you to generate a PDF file that can be directly downloaded by authorized users. The service responds `400` if the file type doesn't exist.

{% raw %}

```typescript
const request = {
  operation: 'generate',
  templateId: 'submission-summary',
  filename: 'my-submission-summary.pdf',
  fileType: 'submission-documents',
  // Template is hydrated with a context of { data }; variables in the template should look like {{ data.myProperty }}.
  data: { applicant: { name: 'Test User' } },
};

const response = await fetch('https://pdf-service.adsp.alberta.ca/pdf/v1/jobs', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});

const { urn, id: jobId, status } = await response.json();
```

{% endraw %}

### Retrieving the generated PDF

Poll the job until its status is `completed` (or `failed`), then download the file from the file service.

```typescript
const response = await fetch(`https://pdf-service.adsp.alberta.ca/pdf/v1/jobs/${jobId}`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const { status, result } = await response.json();

if (status === 'completed') {
  await fetch(`https://file-service.adsp.alberta.ca/file/v1/files/${result.id}/download`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
```

Instead of polling, you can listen for `pdf-service:pdf-generated` on the `pdf-generation-updates` stream of the [push service](push-service.md), and read the file ID from `event.payload.file.id`.
