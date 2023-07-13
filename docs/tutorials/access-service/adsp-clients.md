---
title: ADSP Clients
layout: page
nav_order: 4
parent: Access Service
grand_parent: Tutorials
---

## API Security

ADSP clients are bearer-only clients. This means that you cannot use these clients to retrieve access tokens for your application work. In fact, the only reason these clients have been configured in your tenant is to add additional security when making ADSP API calls.

### Configure an Audience

Some ADSP services, such as the _File Service_, require that it's ID is included as part of an access token's _audience_. If your client needs to access one of these services you can set up the audience as follows.

First, select _clients_ on Keycloaks left side-menu, and then select the client you are using; in this example its the _auto-test-client_.

![](/adsp-monorepo/assets/access-service/client-list.png){: width="400" }

Next, select the Mappers tab, and then click on the _Create_ button. This will bring you to a page that allows you to create a new mapper.

![](/adsp-monorepo/assets/access-service/client-mapper.png){: width="600" }

Select an _Audience_ mapper type, and then the service you wish to include in the AUD portion of the access token generated for this client i.e.

![](/adsp-monorepo/assets/access-service/aud-mapper.png){: width="400" }
