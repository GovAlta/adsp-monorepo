---
title: Introduction
layout: page
nav_order: 1
parent: Form Service
grand_parent: Tutorials
---

## Introduction

The \_Form Service provides a means to build, deploy, and secure forms for data collection. It uses [jsonforms](https://jsonforms.io/) as the underlying technology, which in itself was integrated with GoA's design systems' React library. The result is the capability to quickly build, review, and deploy forms for public consumption.

On its own, the _Form Service_ can be a huge time saver when it comes to developing GoA applications, but used in conjunction with ADSP's _Form App_ and _Task App_ it takes on a life of its own. A form can be immediately available to your end-users through the ADSP [Form App](/adsp-monorepo/tutorials/form-service/form-app.html), and can be reviewed and dispositioned through the ADSP [Task App](/adsp-monorepo/tutorials/task-service/task-app.html). All of that without any coding!

### Building

Jsonforms provides a declarative means for creating new form definitions. Developers provide a JSON-schema to describe the data to be collected, and a UI-schema to describe what the form will look like. This can be done most easily using ADSP's [Form Editor](/adsp-monorepo/tutorials/form-service/building-forms.html). The form definitions are stored in the ADSP database and can be accessed through [its APIs](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Form%20service#).

### Rendering

Currently the Form Service only supports rendering forms in React applications through a Jsonforms React component. [Adding it to your application](/adsp-monorepo/tutorials/form-service/integration.html) enables it to:

- render the form,
- secure access to it,
- collect end-user data

### The Form App

Forms built through the ADSP form editor are automatically available to users through the _Form App_. Once the forms are built and tested in the UAT environment, they can be deployed to production by exporting the UAT schema's through the _Configuration Service_, and then importing them to PROD.

The form app runs on the ADSP servers (ARO) and can be accessed at:

- https://form.adsp-uat.alberta.ca/\<your tenant\>/\<form definition ID\> for testing and development, or
- https://form.adsp.alberta.ca/\<your tenant\>/\<form definition ID\> for production.

Users are able to login to the App and access their personal copy of the form, and

- they can take as long as is needed to fill it out,
- their input is saved automatically,
- reviewers are notified whenever the form is submitted for review,
- once submitted the form is locked form changes,
- assessors can determine and disposition the form as required.

### Security

Security is based on Keycloak roles. Usage of the APIs is restricted to authorized users or clients, and is further described [in the section on security](/adsp-monorepo/tutorials/form-service/security.html). Users logging in to your application can be restricted to:

- filling out the form (applicants),
- reading and updating the form (clerks), and
- managing [form submissions](/adsp-monorepo/tutorials/form-service/form-submissions.html) (assessors).

## Learn More

- Learn how to [use jsonforms](https://jsonforms.io/) to declaratively build and render sophisticated forms.

- Learn more about [ADSP's extensions](/adsp-monorepo/tutorials/form-service/building-forms.html) to jsonforms, for creating steppers, end-user instructions, and other UI tidbits.

- Learn about [form submissions](/adsp-monorepo/tutorials/form-service/form-submissions.html).

- Learn more about [securing your form](/adsp-monorepo/tutorials/form-service/security.html).

- Learn more about [deploying your form](/adsp-monorepo/tutorials/form-service/form-app.html).

- Learn how to [use the Task App](/adsp-monorepo/tutorials/task-service/task-app.html) to review data collected from end-users.
