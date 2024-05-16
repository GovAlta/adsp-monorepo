---
title: Introduction
layout: page
nav_order: 1
parent: Form Service
grand_parent: Tutorials
---

## Introduction

The \_Form Service provides a means to build, deploy, and secure forms for data collection. It uses [jsonforms](https://jsonforms.io/) as the underlying technology, which in itself was integrated with GoA's design systems' React library. The result is the capability to quickly build, review, and deploy forms for public consumption.

On its own, the _Form Service_ can be a huge time saver when it comes to developing GoA applications, but used in conjunction with ADSP's _Form_ and _Task_ Applications it takes on a life of its own. A form can be immediately available to your end-users through the ADSP Form App, and can be reviewed and dispositioned through the ADSP Task App.

### Building

Jsonforms provides a declarative means for creating new forms. Developers provide a JSON-schema to describe the data to be collected, and a UI-schema to describe what the form will look like. This can be done using the ADSP's [Form Editor](/adsp-monorepo/tutorials/form-service/building-a-form.html).

### Embedding a Form in an Application

As of May, 2024, the Form Service only supports rendering forms in React applications through a Jsonforms React component. Simply placing this component in the appropriate place in your application enables it to:

- render the form,
- secure access to it,
- collect end-user data

The application itself will be responsible for saving any data collected from its users.

### Using the Form App

Forms built through the ADSP form editor are automatically available to users through the _Form App_. Once the forms are built and tested in the UAT environment, they can be deployed to production by exporting the UAT schema's through the _Configuration Service_, and then importing them to PROD.

The form app runs on the ADSP servers (ARO) and can be accessed at:
https://form.adsp-uat.alberta.ca/\<your tenant\>/\<the form ID\> for testing and development, or
https://form.adsp.alberta.ca/\<your tenant\>/\<the form ID\> for production.

### Securing

There are three potential means for securing forms depending on the needs of the client:

- User logs in with their GoA credentials. This is useful for forms that need to be filled out by GoA employees.
- User logs in with their _My Alberta Digital ID_. This is useful for locking down end-user access.
- User can enter an email address and use a handshaking protocol for authentication.

**As of May, 2024, only the 1st option is supported. More coming soon**.

## Learn More

- Learn how to [use jsonforms](https://jsonforms.io/) to declaratively build and render sophisticated forms.

- Learn more about [ADSP's extensions](/adsp-monorepo/tutorials/task-service/building-forms.html) to jsonforms, for creating steppers, end-user instructions, and other tidbits.

- Learn more about [securing your form]().

- Learn more about [deploying your form]().

- Learn how to [use the Task App](/adsp-monorepo/tutorials/task-service/introduction.html) to review data collected from end-users.
