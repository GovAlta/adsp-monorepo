---
title: Introduction
layout: page
nav_order: 1
parent: Access Service
grand_parent: Tutorials
---

## Introduction

ADSP is a broad set of API based services that help accelerate application development by providing solutions to common development problems such as:

- Generating PDF documents tailored to specific needs,
- Managing files and access permissions
- Managing tasks
- Monitoring services
- Securing your applications
- etc.

The _Access Service_ is concerned with security, and is based on [Keycloak](https://www.keycloak.org/docs/latest/securing_apps/#planning-for-securing-applications-and-services) and the OIDC authentication protocol. Keycloak, in DDD, it is used for granting user access to applications and for granting applications access to the various ADSP services. The latter is the subject of this tutorial.

## Learn More

- Learn about [tenants and realms](/adsp-monorepo/tutorials/access-service/tenants.html).

- Learn how to [configure a Keycloak client](/adsp-monorepo/tutorials/access-service/application-clients.html) to gain access to the ADSP services.

- Learn how to [secure API calls](/adsp-monorepo/tutorials/access-service/adsp-clients.html), and how ADSP API security works.

- Learn how to [access the ADSP APIs](/adsp-monorepo/tutorials/access-service/front-end-access.html) from the front-end (browser)

- Learn how to [customize the Keycloak login page](/adsp-monorepo/tutorials/access-service/themes.html) to match your application's theme.
