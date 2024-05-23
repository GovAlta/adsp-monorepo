---
title: Form App
layout: page
nav_order: 7
parent: Form Service
grand_parent: Tutorials
---

## Form App

The _Form App_ is a standalone application that allows you users to securely log in and enter data into your forms. It uses the _Form Service_ API's to get the schema's and data required to render a specific form, save data as it is being entered, and _submit_ it for review when it is complete. In other words, developers will be able to quickly build and deploy forms without the need for building a new application.

The form data itself is stored in an ADSP database and is accessible through [an API call](https://api.adsp-uat.alberta.ca/autotest/?urls.primaryName=Form%20service) or through the [Task App](/adsp-monorepo/tutorials/task-service/task-app.html), one of ADSP's other stand-alone applications. If your requirements are to simply review and assess the information (i.e. if the applicant is successful, a clerk or another application takes over) then the _Task App_ is ideal and no coding is necessary. For more sophisticated processing of the information, developers can build their own application to access the form data from ADSP and perhaps disburse it to their own databases for further processing and reporting.

The URL for a specific form is derived from your ADSP tenant-name and the ID of the form. E.g. the URL below allows a user to log in and work with the _Farmers Market License Application_ form in the _AFIDS_ tenant:

```
https://form.adsp-uat.alberta.ca/afids/Farmers-Market-License-Application
```

### Users

Currently only GoA personnel are able to log-in and use the _Form-App_, although ADSP will be implementing other, secure techniques to enable other Albertans to use the product, including

- use of My Alberta Digital ID
- use of email and verification codes

### Security

Developers can define the roles that are required to create, review and disposition their forms specifically, as described in the [security section](/adsp-monorepo/tutorials/task-service/security.html) of the tutorial. In addition, they will also need the ADSP-specific roles . The former should be specific to your _Tenant_ and _Form Definition_, as they will lock down access so that only your users can log-in and fill in the information for a specific form. For the _Form App_, a user will need to be an _applicant_. _Clerks_ and _Assessors_ will be able to review and disposition this forms through the [Task App](/adsp-monorepo/tutorials/task-service/task-app.html).

### User Experience

Ideally users will be able to access the link to the _Form App_ directly from the alberta.ca website. Clicking on it will bring them to the form app where they will be asked to log in. If all their roles and permissions are correct they will see the form in question, e.g.

![](/adsp-monorepo/assets/form-service/formAppExample.png){: width="800" }
