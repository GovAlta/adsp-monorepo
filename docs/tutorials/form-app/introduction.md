---
title: Introduction
layout: page
nav_order: 1
parent: Form App
grand_parent: Tutorials
---

## Introduction

Coupled with the _Form Service_, the _Form Application_ provides a means to build, deploy, and secure forms for data collection. It [uses jsonforms](https://jsonforms.io/) as the underlying technology, which in itself was integrated with GoA's design systems' React library. The result is the capability to quickly build, review and deploy forms for public consumption.

### Building

Jsonforms provides a declarative means for creating new forms. Developers provide a JSON-schema to describe the data to be collected, and a UI-schema to describe what the form will look like. This can be done using the ADSP's [Form Editor](https://adsp-uat.alberta.ca/get-started).

### Deploying

Forms built through the ADSP form editor are automatically available to users through the _Form App_. Once the forms are built and tested in the UAT environment, they can be deployed to production by exporting the UAT schema's through the _Configuration Service_, and then importing them to PROD.

The form app runs on the ADSP servers (ARO) and can be accessed at:
https://form.adsp-uat.alberta.ca/<your tenant>/<the form ID> or
https://form.adsp.alberta.ca/<your tenant>/<the form ID>

### Securing

There are three potential means for securing forms depending on the needs of the client:

- User logs in with their GoA credentials. This is useful for forms that need to be filled out by GoA employees.
- User logs in with their _My Alberta Digital ID_. This is useful for locking down end-user access.
- User can enter an email address and use a handshaking protocol for authentication.

**As of May, 2024, only the 1st option is supported. More coming soon**.

## Learn More

- Learn how to [use jsonforms](https://jsonforms.io/) to declaratively build and render sophisticated forms.

- Learn more about [ADSP's extensions]() to jsonforms, for creating steppers, end-user instructions, and other tidbits.

- Learn more about [securing your form]().

- Learn more about [deploying your form]().

- Learn how to [use the Task App](/adsp-monorepo/tutorials/task-app/introduction.html) to review data collected from end-users.
