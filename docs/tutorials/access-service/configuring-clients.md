---
title: Configuring Clients
layout: page
nav_order: 2
parent: Access Service
grand_parent: Tutorials
---

## Configuring Clients for ADSP API access

Although most of the keycloak configuration is done when a tenant is set up, you will still need to create new _clients_ for you applications. Clients are used to obtain access tokens for _authentication_ and _authorization_, and the ADSP API requires that your client is authorized to access its resources. To configure your clients, log in to ADSP's [Tenant Admin Webapp](https://adsp-uat.alberta.ca) and select the access service tab:

![](/adsp-monorepo/assets/access-service/access-service.png)

Then click on the _Keycloak admin portal_ link, which will bring you to the Keycloak admin page:

![](/adsp-monorepo/assets/access-service/select-keycloak.png)

Now, create a new client in Keycloak, giving it an appropriate name for your application. Be sure to give your client a _confidential_ access type, and _enable service accounts_:

![](/adsp-monorepo/assets/access-service/client-config.png)

when service accounts are enabled you will see a new tab on the client page - _Service Account Roles_:

![](/adsp-monorepo/assets/access-service/client-tabs.png)

_Service accounts_ provide programmatic access to Keycloak's APIs. In particular, the service account for the client is used when your applications logs in to keycloak and requests an access token. Based on the roles configured in the account, the token will grant access (or not) to the requested resources when you call an ADSP Service API.

As an example, suppose you want to use ADSP's [PDF Service](/adsp-monorepo/tutorials/pdf-service/introduction.html). You will need to give your new client the _pdf-generator_ role as follows. Click on the _Service Account Roles_ tab and select the urn:ads:platform:pdf-service client:

![](/adsp-monorepo/assets/access-service/account-roles.png)

In this example, there is only one role for the service, the _pdf-generator_. Other services may have more than one role needed to access all of its resources. Click on the role, then _Add Selected_, and your client will now be able to effectively make use of the PDF Service.
