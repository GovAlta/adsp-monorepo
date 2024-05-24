---
title: Form Submissions
layout: page
nav_order: 4
parent: Form Service
grand_parent: Tutorials
---

## Form Submissions

Forms can be in one of several states - draft, locked, submitted, or archived - and it is the application's responsibility to manage them (if desired). The intended usage for these states is as follows:

- **Draft**: Some forms can be very complex and applicants may need days to complete them. While in draft mode data is being saved, but the application is not considered complete until submitted. Form data cannot be modified unless it is in the draft state.

- **Submitted**: The applicant has completed the form to the best of their ability and wishes it to be reviewed. An assessor will determine the suitability of the application, but can request changes if any are needed. The form would go back into draft mode and the applicant can make the requested revisions. This back-and-forth revision process can go on as ling as needed. Each submission is saved separately, so there is a full history of application changes.

- **Archived**: This is useful for cases where the application is in the draft state, but the form was abandoned for whatever reason. When a form is archived, its data cannot be modified. It is up to the software application to determine when a draft form has become stale and can be archived.

- **Locked**: A draft application can become locked if there is some reason a reviewer needs to temporarily halt the application process. When a form is locked, its data cannot be modified. It is up to the software application to decide when it may be necessary to lock an application.

## Submission Records

If desired, the developer can opt-in to save a _submission record_ whenever a form is submitted, or re-submitted.

![](/adsp-monorepo/assets/form-service/submissionOptIn.png){: width="400" }

_Submission records_ contain a snapshot of the form at the time of the submission, and can be used as audit trails and other purposes. The snapshot contains the data, any uploaded files, the disposition, and other pertinent bits of metadata.

### Disposition

_Submission records_ can be used to help manage _Form Disposition_; that is, the status of the document throughout its history. For example, an assessor may determine the disposition of an application to _accepted_, or _active_, when first submitted, later move it to _inactive_, and finally _archived_. The disposition depends entirely on the intent of the form and what the ministry's policies are. For this reason, developers can define the _disposition states_ that their forms can have when creating a _form definition_:

![](/adsp-monorepo/assets/form-service/dispositionState.png){: width="600" }

### Task Queues

In addition, developers can also opt-in to have the submission record placed in a [Task Queue](/adsp-monorepo/tutorials/task-service.html) for further processing:

![](/adsp-monorepo/assets/form-service/submissionQueue.png){: width="400" }

Advantages of using _Task Service_ queues include:

- GOA personnel can use the _Task App_ to manage submissions and dispositions, so your application doesn't have to.
- You can decouple your intake apps from processing apps,
- you can have asynchronous processing between different parts of the system,
- and you get the other benefits of message queues (RabbitMQ), such as scalability, reliability, priority handling, etc.

### Managing submission records

There are APIs to [manage submission records](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Form%20service#) that can be used to:

- update the submission's disposition,
- get the details of a submission, including the data and metadata, or
- retrieve a curated list of the form's submissions.

To get a submissionID for use in fist two endpoints it is necessary to first search the form's submission records. You can narrow the search using query criteria as documented in swagger.

## Events

Changes to a form or its _state_ will trigger an event, which developers can use for various purposes such as [issuing notifications](/adsp-monorepo/tutorials/notification-service/introduction.html) to subscribers, or keeping an audit trail of the form's history. The events include:

### Existence

- form-service:form-created
- form-service:form-deleted

### State Changes

- form-service:form-archived
- form-service:form-locked
- form-service:form-submitted
- form-service:form-to-draft
- form-service:form-unlocked

### Disposition

- form-service:submission-dispositioned
