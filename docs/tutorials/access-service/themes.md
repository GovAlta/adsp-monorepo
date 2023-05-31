---
title: Keycloak Themes
layout: page
nav_order: 2
parent: Access Service
grand_parent: Tutorials
---

## Keycloak Themes

Keycloak allows you to customize the look and feel it's webpages via themes, and developers can choose a specific theme for the realm being used with their application. So, for example, if the application redirects users to the keycloak login page to sign in, they may want it to match the application's theme.

### Choosing a Theme

The _Access Service_ includes several themes that you can use for applications in your realm. You can choose one by logging in to Keycloak as an admin, and then
navigating to _Realm Settings_ / _Themes_. There you can select a theme for the various pages that your end users can have access to.

![](/adsp-monorepo/assets/access-service/keycloak-themes.png)

The existing set of themes may not suit you needs, however, and you may want to build your own. The _Access Service_ supports this idea, allowing developers to build and test their themes, and then check them into github for deployment.

### New Themes

Keycloak manages themes using Apache's [FreeMarker](https://freemarker.apache.org/docs/index.html), a language used for building templates similar to _Handlebars_ or _Mustache_. In essence, FreeMarker templates are a combination of

- HTML,
- CSS,
- FreeMaker data placeholders,
- FreeMaker conditional statements, and
- FreeMaker iterators

Keycloak uses FreeMarker files to build server-side webpages that then get served up to your users.

Probably the easiest way to build and test a new theme is:

- read the [keycloak guide](https://www.keycloak.org/docs/18.0/server_development/) for developing themes
- clone the [access-service git repository](https://github.com/GovAlta/access-service/tree/aro)
- follow the instructions in the repository to build, test, and deploy your new templates.

If you have any questions please contact the ADSP team on slack (#adsp-connect) or email us at [ADSP Support](adsp@gov.ab.ca).
