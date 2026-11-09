---
layout: page
title: Export service
nav_order: 22
parent: Services
---

# Export service

Export service exports API resources of other services to files. An application queues an export _job_ for a resource, such as the forms of a form definition, and the service reads every page of the resource in the background, writes the results as a CSV or JSON file, and uploads the file to the [file service](file-service.md). Applications poll the job, or listen for export events through the [push service](push-service.md), and then download the file.

## Client roles

client `urn:ads:platform:export-service`

| name       | description                                                                                                                                                                                                                        |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| exporter   | Exporter role that allows creation of export jobs. It also allows reading jobs created by other users, reading the default `export-file` files, and subscribing to the `export-updates` stream. Included in the tenant admin role. |
| export-job | Export job role assigned to the export service service account. Services grant this role read access to the resources they allow to be exported.                                                                                   |

Services can also allow their own roles to export their resources. Export _sources_ in the `platform:export-service` configuration map a service or API URN to `exporterRoles`. For example, [form service](form-service.md) configures `urn:ads:platform:form-service` so that users with the `urn:ads:platform:form-service:form-admin` role can export forms without the exporter role.

## Tenancy

- **Which tenant is used.** Tenant users and service accounts create jobs in the tenant of their token. Core users with the exporter role must set the `tenantId` query parameter when creating a job; the job is created in that tenant.
- **Reading the resource.** The job reads the resource with the export service's own service account, which has the `export-job` role, and passes the job's tenant as the `tenantId` query parameter. The requesting user's roles are checked when the job is created, not when the resource is read.
- **Role scope.** The exporter role, and any exporter roles configured for a source, must be held in the tenant of the request. A core user's exporter role also allows creating jobs.
- **Configuration.** Export sources are read from the `platform:export-service` configuration. When the platform (core) configuration has `sources`, such as the sources registered by form service, they replace the tenant's `sources` as a whole, so tenant sources apply only where there are no platform sources.
- **Export files** are uploaded to the job's tenant.
- **Reading jobs.** The user who created a job can always read it. Other users need the exporter role in the tenant of their token. Core users can read only the jobs they created.

## API overview

All endpoints are under `https://export-service.adsp.alberta.ca/export/v1` and require a bearer token. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                      | Purpose                                     | Required role                                               |
| :---------------------------- | :------------------------------------------ | :---------------------------------------------------------- |
| `POST /export/v1/jobs`        | Queue a job to export a resource to a file. | `exporter`, or an exporter role configured for the resource |
| `GET /export/v1/jobs/{jobId}` | Get the status and result file of a job.    | Creator of the job, or `exporter`                           |

Export files are downloaded through the [file service](file-service.md), and export sources are configured through the [configuration service](configuration-service.md); export service has no endpoints of its own for them.

## Concepts

### Export job

An export job is a request to export one resource. Creating a job queues it in a work queue and responds immediately with the job `id`, `urn`, and `status` of `queued`. The service then:

1. resolves `resourceId` to a URL using the [directory service](directory-service.md);
2. reads the resource 200 results at a time, using the `page.next` cursor of the response as `after` for the next page (up to 10,000 pages), with any `params` added to the query;
3. takes the records from `resultsPath` (default `results`) of each response;
4. writes the records in the `format` (`csv` or `json`) with its `formatOptions`, and uploads the file;
5. sets the job `status` to `completed` with the file in `result`, or to `failed`.

Failed jobs are not retried. Job status is kept for 24 hours after it was last updated; after that the job responds 404.

### Resource

The `resourceId` is the URN of an API resource, such as `urn:ads:platform:form-service:v1:/forms`. The resource must accept the `tenantId`, `top`, and `after` query parameters, and must allow the `urn:ads:platform:export-service:export-job` role. Form, task, value, comment, and configuration services grant the `export-job` role access to resources that support export.

### Format

- **csv** flattens each record, so nested properties become columns such as `data.firstName`. Set `formatOptions.columns` to choose and order the columns, and to set headers: `[{ "key": "data.firstName", "header": "First name" }]`.
- **json** writes the records as a JSON array. Set `formatOptions.fields` to include only some properties, and `formatOptions.pretty` to indent the output.

### Export file

By default, export files are uploaded with the `export-file` file type, which is Protected B, can be read by users with the exporter role, and is deleted after 30 days. Set `fileType` to upload to one of the tenant's own file types instead, for example to give different roles access. The file name is `filename` (default `exported`) with the extension of the format.

## Events

Export service sends these events in the `export-service` namespace. The job ID is the event `correlationId`.

| Event              | Description                                                                               |
| :----------------- | :---------------------------------------------------------------------------------------- |
| `export-queued`    | A job is queued. Includes `jobId`, `resourceId`, `format`, `filename`, and `requestedBy`. |
| `export-completed` | A job is completed. Includes the `file` (`id`, `urn`, and `filename`) and `requestedBy`.  |
| `export-failed`    | A job failed. Includes the `error` message and `requestedBy`.                             |

The `export-updates` [push service](push-service.md) stream includes all three events, and requires the exporter role to subscribe. The `export-completed` event also records the export duration as an interval metric from `export-queued`.

Export service doesn't consume domain events. It listens for configuration updates to refresh its cached export sources.

## Code examples

### Export a resource

Queue a job to export the forms of a form definition to CSV.

```typescript
const exportServiceUrl = 'https://export-service.adsp.alberta.ca';

const response = await fetch(`${exportServiceUrl}/export/v1/jobs`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    resourceId: 'urn:ads:platform:form-service:v1:/forms',
    format: 'csv',
    filename: 'Forms-2026-10-01',
    params: {
      includeData: true,
      criteria: JSON.stringify({ definitionIdEquals: 'income-support-application' }),
    },
    formatOptions: {
      columns: ['id', 'status', { key: 'data.firstName', header: 'First name' }],
    },
  }),
});

const { id, status } = await response.json();
// id: 'a66ccc16-28fc-44fb-a499-d12df0262b8b', status: 'queued'
```

### Get the export file

Poll the job until it is completed, then download the file from the file service.

```typescript
const jobResponse = await fetch(`${exportServiceUrl}/export/v1/jobs/${id}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { status, result } = await jobResponse.json();
if (status === 'completed') {
  // result: { id: '51091c0d-...', urn: 'urn:ads:platform:file-service:v1:/files/51091c0d-...', filename: 'Forms-2026-10-01.csv' }
  const fileResponse = await fetch(`https://file-service.adsp.alberta.ca/file/v1/files/${result.id}/download`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const csv = await fileResponse.text();
}
```

Instead of polling, applications can connect to the `export-updates` stream of the push service and wait for the `export-service:export-completed` or `export-service:export-failed` event with the job ID in `payload.jobId`.
