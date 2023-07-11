---
title: Managing CORS
layout: page
nav_order: 5
parent: Access Service
grand_parent: Tutorials
---

## Cross Origin Resource Sharing (CORS)

If you wish to use the ADSP APIs from within your front-end application (i.e. a browser) you may have to configure your application client to whitelist the ADSP APIs. To do so, log in to your Keycloak realm, select the client you wish to configure, and find the _web origins_ input widget.

![](/adsp-monorepo/assets/access-service/web-origins.png){: width="500" }

There you can enter (and save) the appropriate ADSP domain for your environment.
