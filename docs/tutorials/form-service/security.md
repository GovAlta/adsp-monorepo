---
title: Securing access
layout: page
nav_order: 6
parent: Form Service
grand_parent: Tutorials
---

## Security

Security for the _Form Service_ APIs is based on Keycloak, and there are two types of roles that users and clients need to consider when accessing forms: _Form Definition_ roles, and _ADSP_ roles.

### Form Definition roles

Developers should assign access roles to each _Form Definition_ within a tenant. The _Form Service_ defines three types of users:

- **Applicant**: For users that fill in forms and submit them for review.
- **Clerk**: For GOA personnel that need to review a form and perhaps fill in missing detail.
- **Assessor**: For GOA personnel who are able to assess the information, make decisions, and disposition the form as appropriate

In the Tenant-Management-Webapp developers can assign one or more these user types to one or more tenant-defined keycloak roles. Note: this security is important enough that this step is mandatory. If, when testing you find you are getting 403's, make sure your test user has the right tenant-defined roles. You can assign user types to these roles via the _Roles_ tab in the Form Definition editor:

![](/adsp-monorepo/assets/form-service/userRoles.png){: width="400" }

### ADSP roles

The ADSP-specific roles needed in order for end-users to be able to access a form are:

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
