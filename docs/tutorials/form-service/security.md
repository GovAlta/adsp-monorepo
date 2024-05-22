---
title: Securing access to forms
layout: page
nav_order: 4
parent: Form Service
grand_parent: Tutorials
---

## Security

The _Form Service_ defines three types of users:

- applicants,
- clerks,
- and assessors.

An _applicant_ is someone who is able to fill in a form and submit it for review. _Clerks_ are able to read the information provided by the applicant, perhaps as a preliminary review, while _assessors_ are able to assess the information and disposition the form as appropriate.

Developers can assign these user types to one or more keycloak roles, via the role tab in the form definition editor, as illustrated below:

![](/adsp-monorepo/assets/form-service/userRoles.png){: width="400" }

### Additional roles

There are also some additional, ADSP-specific, roles needed in order for end-users to be able to access a form, including:

#### urn:ads:platform:form-service

- form-admin
- form-file-reader
- form-file-uploader
- form-support
- intake-application

#### realm-management

- query-clients
- query-groups
- query-realms
- query-users

#### urn:ads:platform:tenant-service

- tenant-admin
