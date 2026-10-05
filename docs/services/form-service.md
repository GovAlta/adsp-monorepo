---
layout: page
title: Form service
nav_order: 14
parent: Services
---

# Form service
Form service provides for temporary storage of draft forms with support for verify code based access. This permits applicants to draft and submit forms without a user account.

The form service also includes a set of *events* and a *notification type* for keeping applicants updated on the status of their submission.

## Client roles
client `urn:ads:platform:form-service`

| name | description |
|:-|:-|
| form-admin | Administrator role for form service. This role allows a user to query and unlock forms, and to manage data registers.  |
| intake-application | Intake application role for form service. This role is used to grant a service account the ability to retrieve draft forms and submit forms on behalf of an anonymous applicant.  |

The data register API also accepts the configuration service role `urn:ads:platform:configuration-service:configuration-admin`, which tenant administrators have by default.


## Concepts
### Form definition
Form definition describes a type of form including the allowed applicant and assessor roles and whether anonymous applicants are permitted. Form definitions are configured in the [configuration service](configuration-service.md) under the `platform:form-service` namespace and name.

### Form
Form represents a particular instance of an application including the information entered by the *applicant*. Each form is associated with a *definition* and has a status. Statuses represent the lifecycle steps of the form and include: Draft, Locked, Submitted, and Archived.

### Draft expiry
Draft forms include an expiry process so that information entered into draft forms are purged if the draft is abandoned. If a draft form is not accessed for some expiry period, the form is locked and the applicant is notified. In this state, the form cannot be accessed by the applicant but can be unlocked by an administrator. If the form remains in a locked state for some additional expiry period, the form is deleted so that applicant information is not unnecessarily retained.

### Data register
Data register is a named list of values used to populate drop downs and other choice controls in forms. Each value is either a string or an object, such as a `label` and `value` pair. Forms reference a register by its URN in the UI schema. See the [data registers tutorial](../tutorials/form-service/data-registers.md) for how to use registers in a form.

## Data registers
Form service provides an API to manage the data registers of a tenant. Tenant administrators can also manage them in the tenant management webapp under Form service &rarr; Register data.

Form service stores each register in the [configuration service](configuration-service.md) in two parts:
- **Definition**: the `data-register:<name>` entry in the tenant's `platform:configuration-service` configuration. It holds the register's schema and description.
- **Entries**: the configuration with namespace `data-register` and the register's name. It holds the array of values.

### Endpoints
All endpoints require a user with the `urn:ads:platform:form-service:form-admin` role or the `urn:ads:platform:configuration-service:configuration-admin` role, in the context of a tenant. A core user must specify the tenant with the `tenantId` query parameter. Every endpoint returns 401 if the user is not authenticated, 403 if the user has neither role, and 502 if configuration service fails.

| Method | Path | Description | Responses |
|:-|:-|:-|:-|
| GET | `/form/v1/registers` | Lists the tenant's data registers. | 200 |
| GET | `/form/v1/registers/{name}` | Gets a data register. | 200, 404 |
| POST | `/form/v1/registers` | Creates a data register from `name`, `description` and `entries`. `entries` defaults to an empty array. | 201, 400, 409 |
| PATCH | `/form/v1/registers/{name}` | Updates `description` and/or `entries`. A field that is not sent is left unchanged. | 200, 400, 404 |
| DELETE | `/form/v1/registers/{name}` | Deletes the data register's entries and definition. | 204, 404 |

Registers are returned as `{ namespace: 'data-register', name, description, entries }`.

### Rules
- **Existence**: a register exists only when both its definition (with an array schema) and its entries exist. A register missing either part is not listed. It returns 404 and does not block a create with the same name. This means a create or delete can be retried after a partial failure.
- **Active revision**: `entries` come from the active revision of the configuration, or from the latest revision if none is active. The form app uses the same revision at runtime.
- **Names**: 1 to 50 letters, numbers, spaces, hyphens and underscores. Names are case sensitive.
- **Entries**: an array whose items are all strings or objects.
- **URN**: forms reference a register as `urn:ads:platform:configuration:v2:/configuration/data-register/<name>`. The name is not URL encoded in the URN.
- **Deleting removes data**: a delete removes the register's entries, including their revision history, and its definition. Forms that reference the register lose its options.
- **Anonymous access**: registers are not readable by anonymous applicants unless `anonymousRead` is set on the definition in configuration service. An update keeps this setting, but the API does not set it.
- **Errors**: when configuration service rejects a request, form service returns 400. When configuration service fails or denies access, form service returns 502.

Form service does not emit its own events for data registers. Configuration service emits `configuration-updated` and `configuration-deleted` for the underlying configuration.

## Code examples
### Create a draft form for an anonymous applicant
```typescript
  const form = {
    definitionId,
    applicant: {
      addressAs: 'A.N.Other',
      channels: [{
        channel: 'email',
        address: 'a.n.other@acme.org'
      }]
    }
  }

  const response = await fetch(
    'https://form-service.adsp.alberta.ca/form/v1/forms',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    }
  );

  const {
    id,
    definitionId,
    status,
    created,
    createdBy,
    lastAccessed,
  } = response.json();
```

### Access form data using a time limited code.
Intake applications can retrieve form data on behalf of anonymous applicants by requesting a time limited code to be sent to the applicant. The code is provided to the API and verified when requesting the form data.
```typescript
  // Send a code to the applicant.
  await fetch(
    `https://form-service.adsp.alberta.ca/form/v1/forms/${formId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'send-code',
      }),
    }
  );

  // Get the code via user input and send it to the API to access the form data.
  const response = await fetch(
    `https://form-service.adsp.alberta.ca/form/v1/forms/${formId}/data?code=${code}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const {
    data,
    files,
  } = await response.json();
```

### Update data in a draft form
```typescript
  const formData = {
    data: {}
    files: {
      'proof-of-status': fileUrn,
    }
  }

  const response = await fetch(
    `https://form-service.adsp.alberta.ca/form/v1/forms/${formId}/data`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    }
  );

  const {
    data,
    files,
  } = await response.json();
```

### Submit a form
```typescript
  const response = await fetch(
    `https://form-service.adsp.alberta.ca/form/v1/forms/${formId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'submit'
      }),
    }
  );

  const {
    id,
    status,
    submitted,
  } = await response.json();
```
