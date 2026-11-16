---
layout: page
title: Form service
parent: Services
---

# Form service

Form service provides for temporary storage of draft forms with support for verify code based access. This permits applicants to draft and submit forms without a user account.

The form service also includes a set of _events_ and a _notification type_ for keeping applicants updated on the status of their submission.

## Client roles

client `urn:ads:platform:form-service`

| name                  | description                                                                                                                                                                                                                                                                      |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| form-admin            | Administrator role for form service. This role allows a user to manage form definitions, find and read all forms and submissions of the tenant, unlock, archive and delete forms, delete submissions, manage data registers, and submit, read, approve and deny access requests. |
| intake-application    | Intake application role for form service. This role is used to grant a service account the ability to retrieve draft forms and submit forms on behalf of an anonymous applicant.                                                                                                 |
| form-applicant        | Applicant role for form service that allows a user to apply from the form app. It permits subscribing to the submitted form PDF and form question update streams.                                                                                                                |
| form-support          | Support role for viewing and responding to form question topics. It is a commenter role of the form questions comment topic type, and a subscriber role of the form message reviewer notifications.                                                                              |
| form-file-reader      | File reader role that allows assessors and clerks to review uploaded supporting documents.                                                                                                                                                                                       |
| form-file-uploader    | File uploader role that allows applicants to upload supporting documents for the form.                                                                                                                                                                                           |
| form-tester           | Tester role for form service that allows access to forms without open intakes.                                                                                                                                                                                                   |
| form-service          | Form service role used to permit deletion of orphaned form support document files.                                                                                                                                                                                               |
| form-access-requester | Registration requester role that allows submitting a request for access to a restricted form, and reading your own request.                                                                                                                                                      |
| form-access-reader    | Registration reader role that allows reading the access requests of restricted forms.                                                                                                                                                                                            |
| form-access-writer    | Registration writer role that allows reading, approving and denying the access requests of restricted forms.                                                                                                                                                                     |

The data register API also accepts the configuration service role `urn:ads:platform:configuration-service:configuration-admin`, which tenant administrators have by default. Form and submission searches also accept the export service role `urn:ads:platform:export-service:export-job`.

Each form definition also names its own **applicant**, **clerk** and **assessor** roles. These are tenant roles, and they control who can create and fill in forms of the definition, and who can review its submissions.

## Tenancy

- **Which tenant is used.** Tenant users and service accounts act on the tenant of their token. Core (platform) users set the `tenantId` query parameter to choose the tenant. The form definition, form, submission, data register and intake schedule endpoints act on one tenant, so core users must set `tenantId` on them.
- **Anonymous requests.** Only `GET /form/v1/definitions/{definitionId}` allows anonymous requests, for definitions that allow anonymous applications. Anonymous requests have no token to determine the tenant from, so they must include `tenantId`; without it the request responds 400.
- **Form definitions.** Form definitions are tenant configuration in the [configuration service](configuration-service.md). Form service uses the tenant's own definitions and does not fall back to platform definitions.
- **Isolation.** Forms and submissions are stored with the ID of their tenant. A form or submission ID from another tenant responds 404, not 403. Access requests are stored with the ID of their tenant and form definition; a request ID of another tenant or definition also responds 404.
- **Role scope.** The roles of a form definition must be held in the tenant. Most `form-admin` checks also accept a core user with the role, but listing definitions, reading a definition, finding submissions and setting a form back to draft need the role in the tenant. The `export-job` role is accepted from core service accounts.

## API overview

All endpoints are under `https://form-service.adsp.alberta.ca/form/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Endpoint                                                                                            | Purpose                                                                                                | Required role                                                                                                                                                                   |
| :-------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /form/v1/definitions`                                                                          | List and search form definitions.                                                                      | `form-admin`                                                                                                                                                                    |
| `POST /form/v1/definitions`                                                                         | Create a form definition from a name and description.                                                  | `form-admin`                                                                                                                                                                    |
| `GET /form/v1/definitions/{definitionId}`                                                           | Read a form definition and its current intake.                                                         | `form-admin`, `intake-application`, or the definition's applicant or clerk roles; anonymous for definitions that allow anonymous applications                                   |
| `PUT`, `PATCH`, `DELETE /form/v1/definitions/{definitionId}`                                        | Replace, update or delete a form definition.                                                           | `form-admin`                                                                                                                                                                    |
| `PUT /form/v1/definitions/{definitionId}/schemas`                                                   | Update the data and UI schemas.                                                                        | `form-admin`                                                                                                                                                                    |
| `PUT /form/v1/definitions/{definitionId}/roles`                                                     | Replace the applicant, assessor and clerk roles.                                                       | `form-admin`                                                                                                                                                                    |
| `PATCH /form/v1/definitions/{definitionId}/lifecycle`                                               | Update the anonymous application, applicant limit, support topic and security classification settings. | `form-admin`                                                                                                                                                                    |
| `PATCH /form/v1/definitions/{definitionId}/submission-actions`                                      | Update what happens when a form is submitted.                                                          | `form-admin`                                                                                                                                                                    |
| `PUT /form/v1/definitions/{definitionId}/schedule`                                                  | Update the scheduled intake period.                                                                    | `form-admin`                                                                                                                                                                    |
| `POST /form/v1/definitions/{definitionId}/access-requests`                                          | Request access to a restricted form.                                                                   | `form-access-requester` or `form-admin`                                                                                                                                         |
| `GET /form/v1/definitions/{definitionId}/access-requests`                                           | Find the access requests of a form, by status, newest first.                                           | `form-access-reader`, `form-access-writer` or `form-admin`                                                                                                                      |
| `GET /form/v1/definitions/{definitionId}/access-requests/{email}`                                   | Read the latest access request of an email address.                                                    | The user with that email address, `form-access-reader`, `form-access-writer` or `form-admin`                                                                                    |
| `PATCH /form/v1/definitions/{definitionId}/access-requests/{requestId}`                             | Approve or deny a pending access request.                                                              | `form-access-writer` or `form-admin`                                                                                                                                            |
| `GET /form/v1/forms`                                                                                | Find forms.                                                                                            | Any signed-in user; `form-admin` and `export-job` find all forms, assessors find the submitted forms of their definition, and other users find the forms they created           |
| `POST /form/v1/forms`                                                                               | Create a draft form, and optionally submit it.                                                         | The definition's applicant or clerk roles; `intake-application` for definitions that allow anonymous applications                                                               |
| `GET /form/v1/forms/{formId}`                                                                       | Read a form.                                                                                           | `form-admin`, `intake-application`, the definition's clerk or assessor roles, or the applicant who created it                                                                   |
| `POST /form/v1/forms/{formId}`                                                                      | Run a form operation: `send-code`, `unlock`, `submit`, `to-draft` or `archive`.                        | Depends on the operation (see the API documentation)                                                                                                                            |
| `DELETE /form/v1/forms/{formId}`                                                                    | Delete a form and its files.                                                                           | `form-admin`; the definition's clerk roles or the applicant who created it, for draft forms                                                                                     |
| `GET`, `PUT /form/v1/forms/{formId}/data`                                                           | Read or update the form data.                                                                          | The applicant who created it or the definition's clerk roles; reading also allows `form-admin`, assessors of submitted forms, and `intake-application` with a verification code |
| `GET /form/v1/submissions`, `GET /form/v1/forms/{formId}/submissions`                               | Find submissions.                                                                                      | `form-admin`, `export-job`, or the definition's assessor roles                                                                                                                  |
| `GET /form/v1/submissions/{submissionId}`, `GET /form/v1/forms/{formId}/submissions/{submissionId}` | Read a submission.                                                                                     | `form-admin` or the definition's assessor roles                                                                                                                                 |
| `POST /form/v1/forms/{formId}/submissions/{submissionId}`                                           | Disposition a submission.                                                                              | `form-admin` or the definition's assessor roles                                                                                                                                 |
| `POST /form/v1/forms/{formId}/submissions/{submissionId}/notes`, `DELETE .../notes/{noteId}`        | Add or remove a reviewer note.                                                                         | `form-admin` or the definition's assessor roles                                                                                                                                 |
| `DELETE /form/v1/submissions/{submissionId}`                                                        | Delete a submission.                                                                                   | `form-admin`                                                                                                                                                                    |
| `/form/v1/registers`                                                                                | Manage data registers (see [Data registers](#data-registers)).                                         | `form-admin` or `configuration-admin`                                                                                                                                           |

Form definitions are stored in the configuration service, so they can also be managed through the configuration service API.

## Concepts

### Form definition

Form definition describes a type of form including the allowed applicant and assessor roles and whether anonymous applicants are permitted. Form definitions are configured in the [configuration service](configuration-service.md) under the `form-service` namespace, with the definition ID as the name.

### Form

Form represents a particular instance of an application including the information entered by the _applicant_. Each form is associated with a _definition_ and has a status. Statuses represent the lifecycle steps of the form and include: Draft, Locked, Submitted, and Archived.

### Submission

When a form is submitted and its definition has submission records enabled, form service creates a _submission_ with a copy of the form data. Assessors review submissions, add notes, and record a _disposition_ using one of the definition's disposition states. A form that is set back to draft and submitted again gets a new submission.

### Draft expiry

Draft forms include an expiry process so that information entered into draft forms are purged if the draft is abandoned. If a draft form is not accessed for some expiry period, the form is locked and the applicant is notified. In this state, the form cannot be accessed by the applicant but can be unlocked by an administrator. If the form remains in a locked state for some additional expiry period, the form is deleted so that applicant information is not unnecessarily retained.

### Data register

Data register is a named list of values used to populate drop downs and other choice controls in forms. Each value is either a string or an object, such as a `label` and `value` pair. Forms reference a register by its URN in the UI schema. See the [data registers tutorial](../tutorials/form-service/data-registers.md) for how to use registers in a form.

### Access request

Some forms are restricted to a segment of the population, for example to physicians and nurses in Alberta. A form definition is restricted by its `registration` configuration:

- `enabled`: whether the form is restricted and accepts access requests.
- `dataSchema` and `uiSchema`: the registration questions that help a reviewer decide whether the applicant meets the criteria. The questions can't define `firstName`, `lastName` or `email`, since every request includes them.
- `accessGroup`: the Keycloak group containing the roles needed to access the form. It is not returned by the form APIs.

An applicant submits an _access request_ with their name, email address and answers. Answers are validated against the registration questions, and answers to questions that aren't defined are rejected. The request starts as `pending`, and an administrator then approves or denies it. Each email address can have only one pending request per form; after a request is reviewed, the applicant can submit a new one. Approved or denied requests can't be reviewed again.

Form service only records requests and reviews. It doesn't create Keycloak accounts, add users to the access group, or notify the applicant.

## Data registers

Form service provides an API to manage the data registers of a tenant. Tenant administrators can also manage them in the tenant management webapp under Form service &rarr; Register data.

Form service stores each register in the [configuration service](configuration-service.md) in two parts:

- **Definition**: the `data-register:<name>` entry in the tenant's `platform:configuration-service` configuration. It holds the register's schema and description.
- **Entries**: the configuration with namespace `data-register` and the register's name. It holds the array of values.

### Endpoints

All endpoints require a user with the `urn:ads:platform:form-service:form-admin` role or the `urn:ads:platform:configuration-service:configuration-admin` role, in the context of a tenant. A core user must specify the tenant with the `tenantId` query parameter. Every endpoint returns 401 if the user is not authenticated, 403 if the user has neither role, and 502 if configuration service fails.

| Method | Path                        | Description                                                                                             | Responses     |
| :----- | :-------------------------- | :------------------------------------------------------------------------------------------------------ | :------------ |
| GET    | `/form/v1/registers`        | Lists the tenant's data registers.                                                                      | 200           |
| GET    | `/form/v1/registers/{name}` | Gets a data register.                                                                                   | 200, 404      |
| POST   | `/form/v1/registers`        | Creates a data register from `name`, `description` and `entries`. `entries` defaults to an empty array. | 201, 400, 409 |
| PATCH  | `/form/v1/registers/{name}` | Updates `description` and/or `entries`. A field that is not sent is left unchanged.                     | 200, 400, 404 |
| DELETE | `/form/v1/registers/{name}` | Deletes the data register's entries and definition.                                                     | 204, 404      |

Registers are returned as `{ namespace: 'data-register', name, description, entries }`.

### Rules

- **Existence**: a register exists only when both its definition (with an array schema) and its entries exist. A register missing either part is not listed. It returns 404 and does not block a create with the same name. This means a create or delete can be retried after a partial failure.
- **Active revision**: `entries` come from the active revision of the configuration, or from the latest revision if none is active. The form app uses the same revision at runtime.
- **Writing entries publishes them**: configuration service only writes to the latest revision. When a create or update writes `entries` and an older revision is pinned as active, the pin moves to the revision just written, so the change is live straight away. The older revision stays in the revision history and can be pinned again in configuration service. Updating only `description` leaves the pin alone.
- **Names**: 1 to 50 letters, numbers, spaces, hyphens and underscores. Names can't start or end with a space. Names are case sensitive.
- **Entries**: an array whose items are all strings or objects.
- **URN**: forms reference a register as `urn:ads:platform:configuration:v2:/configuration/data-register/<name>`. The name is not URL encoded in the URN.
- **Deleting removes data**: a delete removes the register's entries, including their revision history, and its definition. Forms that reference the register lose its options.
- **Anonymous access**: registers are not readable by anonymous applicants unless `anonymousRead` is set on the definition in configuration service. An update keeps this setting, but the API does not set it.
- **Errors**: when configuration service rejects a request, form service returns 400. When configuration service fails or denies access, form service returns 502.
- **Service account role**: form service calls configuration service with its own service account. Deleting a register and moving the active revision need that account to have the configuration service `configuration-admin` role.

Form service does not emit its own events for data registers. Configuration service emits `configuration-updated` and `configuration-deleted` for the underlying configuration.

## Events

Form service sends these domain events in the `form-service` namespace. Form events use the form ID as the correlation ID.

| name                      | sent when                                                                                                                          |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| form-created              | A draft form is created. When a form is created with `submit: true`, `form-submitted` is sent instead.                             |
| form-locked               | The draft expiry job locks a draft that has not been accessed.                                                                     |
| form-unlocked             | An administrator unlocks a locked form.                                                                                            |
| form-submitted            | A form is submitted. The form data is included when the definition sets `includeDataInSubmission`.                                 |
| form-to-draft             | A submitted form is set back to draft.                                                                                             |
| form-archived             | A form is archived.                                                                                                                |
| form-deleted              | A form is deleted through the API or by the draft expiry job.                                                                      |
| submission-dispositioned  | A submission is dispositioned.                                                                                                     |
| submission-deleted        | A submission is deleted.                                                                                                           |
| form-message-to-applicant | A reviewer posts a message on a form's questions topic.                                                                            |
| form-message-to-reviewer  | An applicant posts a message and a reviewer is part of the conversation.                                                           |
| form-message-forwarded    | An applicant posts a message, no reviewer is part of the conversation, and the definition sets an address to forward questions to. |
| registration-submitted    | An access request for a restricted form is submitted.                                                                              |
| registration-reviewed     | An access request is approved or denied.                                                                                           |

Access request events use the request ID as the correlation ID, and include its `id`, `formDefinitionId`, `status`, `submittedAt`, `reviewedAt` and `reviewedBy`. The applicant's name, email address and answers are not included.

When a definition sets a custom submission event (`event` in the submission actions), form service also sends that event, in the namespace and with the name it configures, each time a form is submitted.

Form service registers the `form-status-updates`, `form-message-notifications` and `form-message-reviewer-notifications` notification types, which notify applicants and reviewers of these events. It also registers two push service streams: `submitted-form-pdf-updates` (PDF service PDF generation events) and `form-questions-updates` (comment service events on form question topics).

Form service consumes the comment service `comment-created` event for form question topics to send the message events above.

## Audit actions

Form service records audit events in the `form-service` namespace of the [audit service](audit-service.md). Records are written to the tenant of the form, submission or data register. Form records use the form as the resource (`{ type: 'form', id: <form ID> }`) and correlation ID, with the form `definitionId`, `status` (after the operation), `anonymousApplicant` and `dryRun` in the metadata. Form data and applicant details are never recorded. All actions are version 1.

| action                  | category       | severity | retention class | recorded when                                                                                                                                                                                                                                                        |
| :---------------------- | :------------- | :------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| form.created            | administrative | info     | compliance      | A draft form is created, with `hasApplicant` in the metadata.                                                                                                                                                                                                        |
| form.data-updated       | data-access    | info     | standard        | Form data is written, including data sent when creating a form. Drafts are autosaved as the applicant types, so updates are recorded at most once per form and caller in 15 minutes (tracked by each service instance). Only `fileCount` is recorded about the data. |
| form.submitted          | administrative | info     | compliance      | A form is submitted, including when it is created with `submit: true`, with the `submissionId` if a submission record is created.                                                                                                                                    |
| form.locked             | administrative | warning  | compliance      | The draft expiry job locks an inactive draft, with `reason: 'inactivity'` and `lastAccessed` in the metadata.                                                                                                                                                        |
| form.unlocked           | administrative | warning  | compliance      | An administrator unlocks a locked form, with the previous `locked` time in the metadata.                                                                                                                                                                             |
| form.set-to-draft       | administrative | warning  | compliance      | A submitted form is set back to draft.                                                                                                                                                                                                                               |
| form.archived           | administrative | info     | compliance      | A form is archived.                                                                                                                                                                                                                                                  |
| form.deleted            | administrative | warning  | compliance      | A form and its files are deleted through the API, or by the draft expiry job (with `reason: 'lock-expired'` and the `locked` time in the metadata).                                                                                                                  |
| form.access-code-sent   | security       | info     | security        | An access code is sent to the applicant of a form, with the notification `channels` types in the metadata.                                                                                                                                                           |
| form.accessed-with-code | security       | info     | security        | Form data is read using a verified access code.                                                                                                                                                                                                                      |
| submission.deleted      | administrative | warning  | compliance      | A form submission is deleted. The resource is `{ type: 'submission', id: <submission ID> }` and the correlation ID is the form ID.                                                                                                                                   |
| data-register.created   | administrative | info     | standard        | A data register is created, with its `entryCount`.                                                                                                                                                                                                                   |
| data-register.updated   | administrative | info     | standard        | A data register is updated, with the `updatedFields` and the `entryCount`.                                                                                                                                                                                           |
| data-register.deleted   | administrative | warning  | standard        | A data register is deleted.                                                                                                                                                                                                                                          |
| registration.submitted  | administrative | info     | standard        | An access request is submitted.                                                                                                                                                                                                                                      |
| registration.reviewed   | administrative | info     | compliance      | An access request is approved or denied.                                                                                                                                                                                                                             |

Access request records use `{ type: 'registration', id: <request ID> }` as the resource and the request ID as the correlation ID, with the `definitionId` and `status` in the metadata.

Data register records use `{ type: 'data-register', id: <name>, name: <name> }` as the resource and the register name as the correlation ID. Configuration service also records `configuration.updated` and `configuration.deleted` for the underlying configuration, attributed to the form service account; the form service records identify the user who made the change.

Operations that an intake application performs for an anonymous applicant are recorded with the actor `{ id: 'anonymous-applicant', type: 'user', name: 'Anonymous applicant' }` and the intake application's service account ID as `callerId` in the metadata. The draft expiry job is recorded with the system actor `form-service-job`. Other operations are recorded with the signed-in user or service account.

Reading forms, submissions or form data (other than by access code) is not audited. Submission disposition and notes are not audited. Denied and failed operations are not recorded. Changes to form definitions are not recorded by form service, since form definitions are managed in the [configuration service](configuration-service.md); audit records of those changes are in the `configuration-service` namespace.

Draft data is saved frequently, so form service sends audit events in batches of up to 100 events. On shutdown, it waits for in-flight requests to complete and then delivers the buffered events before exiting. Audit failures are logged by the SDK and do not fail the form operation. The form service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.

Audit recording is on by default. Set the environment variable `FORM_AUDIT_ENABLED=false` on form service to turn it off, or `true` to turn it on regardless of the SDK `AUDIT_ENABLED` variable, which applies when `FORM_AUDIT_ENABLED` is not set. The action catalog is still registered while recording is off, so turning it back on needs only a restart.

## Code examples

### Create a form definition

```typescript
const response = await fetch('https://form-service.adsp.alberta.ca/form/v1/definitions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Business licence application',
    description: 'Application for a municipal business licence.',
  }),
});

// The ID is generated from the name, for example 'business-licence-application'.
const { id, revision } = await response.json();

// Set who can apply and who can assess submissions.
await fetch(`https://form-service.adsp.alberta.ca/form/v1/definitions/${id}/roles`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    applicantRoles: ['business-licence-applicant'],
    assessorRoles: ['business-licence-assessor'],
  }),
});
```

### Create a draft form for an anonymous applicant

```typescript
const form = {
  definitionId,
  applicant: {
    addressAs: 'A.N.Other',
    channels: [
      {
        channel: 'email',
        address: 'a.n.other@acme.org',
      },
    ],
  },
};

const response = await fetch('https://form-service.adsp.alberta.ca/form/v1/forms', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(form),
});

const { id, definition, status, created, createdBy, lastAccessed } = await response.json();
```

### Access form data using a time limited code.

Intake applications can retrieve form data on behalf of anonymous applicants by requesting a time limited code to be sent to the applicant. The code is provided to the API and verified when requesting the form data.

```typescript
// Send a code to the applicant.
await fetch(`https://form-service.adsp.alberta.ca/form/v1/forms/${formId}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    operation: 'send-code',
  }),
});

// Get the code via user input and send it to the API to access the form data.
const response = await fetch(`https://form-service.adsp.alberta.ca/form/v1/forms/${formId}/data?code=${code}`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${accessToken}` },
});

const { data, files } = await response.json();
```

### Update data in a draft form

Files are referenced by their file service URN in the data. Form service finds the file references using the data schema, and returns them in `files`.

```typescript
const formData = {
  data: {
    businessName: 'Example Bakery Ltd.',
    proofOfStatus: fileUrn,
  },
};

const response = await fetch(`https://form-service.adsp.alberta.ca/form/v1/forms/${formId}/data`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(formData),
});

const { data, files } = await response.json();
```

### Submit a form

```typescript
const response = await fetch(`https://form-service.adsp.alberta.ca/form/v1/forms/${formId}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    operation: 'submit',
  }),
});

const { id, status, submitted, submission } = await response.json();
```

### Disposition a submission

Assessors find the submissions of a definition that are waiting for a decision, and record a disposition using one of the definition's disposition states.

```typescript
const criteria = JSON.stringify({ definitionIdEquals: definitionId, dispositioned: false });
const response = await fetch(
  `https://form-service.adsp.alberta.ca/form/v1/submissions?criteria=${encodeURIComponent(criteria)}`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);
const { results, page } = await response.json();

const [{ id: submissionId, formId }] = results;
const dispositionResponse = await fetch(
  `https://form-service.adsp.alberta.ca/form/v1/forms/${formId}/submissions/${submissionId}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dispositionStatus: 'Approved',
      dispositionReason: 'Application meets all eligibility criteria.',
    }),
  },
);

const { disposition } = await dispositionResponse.json();
```

### Request and review access to a restricted form

An applicant with the `form-access-requester` role requests access to a form whose definition has registration enabled.

```typescript
const response = await fetch(
  `https://form-service.adsp.alberta.ca/form/v1/definitions/${definitionId}/access-requests`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@gov.ab.ca',
      data: { profession: 'physician', registrationNumber: '12345' },
    }),
  },
);

const { id, status } = await response.json();
```

An administrator with the `form-access-writer` role finds the pending requests and approves one.

```typescript
const response = await fetch(
  `https://form-service.adsp.alberta.ca/form/v1/definitions/${definitionId}/access-requests?status=pending`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);
const { results, page } = await response.json();

const [{ id: requestId }] = results;
const reviewResponse = await fetch(
  `https://form-service.adsp.alberta.ca/form/v1/definitions/${definitionId}/access-requests/${requestId}`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'approved' }),
  },
);

const { status, reviewedAt, reviewedBy } = await reviewResponse.json();
```
