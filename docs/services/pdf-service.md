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

| name          | description                                                                                            |
| :------------ | :----------------------------------------------------------------------------------------------------- |
| pdf-generator | Generator role for the PDF service. This role grants the ability to generate PDF files from templates. |

## Concepts

### PDF template

_Templates_ represent a standard PDF document with template variables for its contents.

### Job

PDF service performs operations asynchronously using a job queue. _Jobs_ represent the state of those operations in the queue and are retained for around 24 hrs.

## Audit actions

PDF service records audit events in the `pdf-service` namespace of the [audit service](audit-service.md). Action names start with `pdf.` so they do not take generic names such as `job.created` from tenant catalogs. Records are written to the tenant of the job or template. All actions are version 1, and their retention class is derived from the category.

| action | category | severity | retention class | recorded when |
|:-|:-|:-|:-|:-|
| pdf.job.created | runtime | info | standard | A PDF generation job is queued through `POST /pdf/v1/jobs`. |
| pdf.job.generated | runtime | info | standard | A generation job finishes: status `success` when the PDF is stored in file service, with the resulting `fileId` in the metadata, or status `failure` when the job fails, with the `error` in the metadata. |
| pdf.template.created | administrative | info | compliance | A template is created through `POST /pdf/v1/templates`. |
| pdf.template.updated | administrative | warning | compliance | A template is updated through `PATCH /pdf/v1/templates/{templateId}`, with the names of the changed fields as `changedFields` in the metadata. |
| pdf.template.deleted | administrative | warning | compliance | A template is deleted through `DELETE /pdf/v1/templates/{templateId}`. |

Job records have the job as the resource (`{ type: 'pdf-job', id: <job ID>, name: <filename> }`), the `recordId` of the generated file as the correlation ID, and the `templateId`, `filename`, `fileType` and `recordId` in the metadata. Since file service uses the same `recordId` as the correlation ID, the `fileId` and correlation ID link a job to the `file.uploaded` record of the generated file. `pdf.job.generated` is recorded by the job worker after generation completes, with the requester of the job as the actor; a failure is recorded only when the job is marked failed, not on an attempt that will be retried. Failures are found by filtering on `status=failure`.

Template records have the template as the resource (`{ type: 'pdf-template', id: <template ID>, name: <name> }`) and the `templateId` and `name` in the metadata. Template changes made directly in the [configuration service](configuration-service.md) rather than through the PDF service API are recorded only in the `configuration-service` namespace; changes through the PDF service API are recorded in both. Reads of templates and job status are not recorded.

Audit failures are logged by the SDK and do not fail the PDF operation. The PDF service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.

Audit recording is on by default. Set the environment variable `PDF_AUDIT_ENABLED=false` on PDF service to turn it off, or `true` to turn it on regardless of the SDK `AUDIT_ENABLED` variable, which applies when `PDF_AUDIT_ENABLED` is not set. The action catalog is still registered while recording is off, so turning it back on needs only a restart.

## Code examples

### Configure a template

Templates are configured using the [configuration service](configuration-service.md).

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

Generated PDFs are uploaded to the [file service](file-service.md) and the _file type_ used can be specified in the request. This allows you to generate a PDF file that can be directly downloaded by authorized users.

```typescript
  const request = {
    operation: 'generate',
    templateId: 'submission-summary',
    filename: 'my-submission-summary.pdf'
    fileType: 'submission-documents',
    // Template is hydrated with a context of { data }; variables in the template should look like {{ data.myProperty }}.
    data: {},
  }

  const response = await fetch(
    'https://pdf-service.adsp.alberta.ca/pdf/v1/jobs',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
    }
  );

  const {
    urn,
    id,
    status,
  } = await response.json();
```

### Retrieving the generated PDF

Generated PDFs are uploaded to the file service.

```typescript
const response = await fetch(`https://pdf-service.adsp.alberta.ca/pdf/v1/jobs/${jobId}`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});

const {
  status,
  result: { urn, id: fileId },
} = await response.json();

await fetch(`https://file-service.adsp.alberta.ca/file/v1/files/${fileId}/download`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});
```
