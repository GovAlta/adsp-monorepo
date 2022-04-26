---
layout: page
title: PDF service
nav_order: 15
parent: Services
---

# PDF service
PDF service provides utility PDF operations like generation of PDFs from templates.

## Client roles
client `urn:ads:platform:pdf-service`

| name | description |
|:-|:-|
| pdf-generator | Generator role for the PDF service. This role grants the ability to generate PDF files from templates. |

## Concepts
### PDF template
*Templates* represent a standard PDF document with template variables for its contents.

### Job
PDF service performs operations asynchronously using a job queue. *Jobs* represent the state of those operations in the queue and are retained for around 24 hrs.

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
      }
    }
  }

  await fetch(
    `${configurationServiceUrl}/configuration/v1/configuration/platform/pdf-service`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
    }
  );
```

### Create a PDF generation job
Generated PDFs are uploaded to the [file service](file-service.md) and the *file type* used can be specified in the request. This allows you to generate a PDF file that can be directly downloaded by authorized users.

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
  const response = await fetch(
    `https://pdf-service.adsp.alberta.ca/pdf/v1/jobs/${jobId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
    }
  );

  const {
    status,
    result: {
      urn,
      id: fileId,
    }
  } = await response.json();

  await fetch(
    `https://file-service.adsp.alberta.ca/file/v1/files/${fileId}/download`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
```
