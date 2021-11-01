---
layout: page
title: Form service
nav_order: 13
parent: Services
---

# Form service
Form service provides for temporary storage of draft forms with support for verify code based access. This permits applicants to draft and submit forms without a user account.

The form service also includes a set of *events* and a *notification type* for keeping applicants updated on the status of their submission.

## Client roles
client `urn:ads:platform:form-service`

| name | description |
|:-|:-|
| form-admin | Administrator role for form service. This role allows a user to query and unlock forms.  |
| intake-application | Intake application role for form service. This role is used to grant a service account the ability to retrieve draft forms and submit forms on behalf of an anonymous applicant.  |


## Concepts
### Form definition
Form definition describes a type of form including the allowed applicant and assessor roles and whether anonymous applicants are permitted.

### Form
Form represents a particular instance of an application including the information entered by the *applicant*. Each form is associated with a *definition* and has a status. Statuses represent the lifecycle steps of the form and include: Draft, Locked, Submitted, and Archived.

### Draft expiry
Draft forms include an expiry process so that information entered into draft forms are purged if the draft is abandoned. If a draft form is not accessed for some expiry period, the form is locked and the applicant is notified. In this state, the form cannot be accessed by the applicant but can be unlocked by an administrator. If the form remains in a locked state for some additional expiry period, the form is deleted so that applicant information is not unnecessarily retained.

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
    'https://form-service.alpha.alberta.ca/form/v1/forms',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
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
    `https://form-service.alpha.alberta.ca/form/v1/forms/${formId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        operation: 'send-code',
      }),
    }
  );

  // Get the code via user input and send it to the API to access the form data.
  const response = await fetch(
    `https://form-service.alpha.alberta.ca/form/v1/forms/${formId}/data?code=${code}`,
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
    `https://form-service.alpha.alberta.ca/form/v1/forms/${formId}/data`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
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
    `https://form-service.alpha.alberta.ca/form/v1/forms/${formId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
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





