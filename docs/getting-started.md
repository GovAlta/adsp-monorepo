---
layout: page
title: Getting started
nav_order: 1
---
<details open markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

# Getting started
Product teams can get started by accessing an existing tenant or creating a new tenant. Each tenant represents a zone of administrative control and generally products within a common service area can share a tenant.

**To create a new tenant**
1. Go to [ADSP Home](https://adsp.alpha.alberta.ca);
2. click the *Get Started* button. (You may require approval from the platform team to complete the tenant creation process.)
3. Congratulations! You have a tenant in ADSP.

## Overview of tenant administration
The tenant administration app allows you to configure platform services for your tenant. It consists of three general sections:

1. Navigation menu allows you to switch between items
2. Main content shows the informational and configuration content of the selected item
3. Aside content that provides links to supporting content

## Administering your tenant
After your tenant is created, you will have access to the tenant administration application. As the original creator of a tenant, you can login from the landing page of ADSP to access tenant administration.

For other team members, note the instructions and tenant specific login url shown in the aside on the *Dashboard* view (either on the right or the bottom). Team members can login via this url to provision their user in the tenant realm; they will start with no access to tenant administration.

**To grant administration access to team members**
1. Select *Services* -> *Access* in the navigation menu.
2. Use the *Keycloak Admin Portal* link to access Keycloak realm administration for your tenant.
3. Select *Manage* -> *Users* and click the *View all users* button.
4. Select the team member you wish to grant access to, and select *Role Mappings*.
5. Under *Client Roles*, select `urn:ads:platform:tenant-service` and add the `tenant-admin` role.
6. Your team member can now access tenant administration via the tenant specific login url.

## Configuring a platform service
You can access configuration for the platform services from the left-side navigation menu in tenant administration. We will walk through a simple configuration for the event-service as an example.

**To add an event definition**
1. Select *Services* -> *Events* in the navigation menu.
2. Select the *Definitions* tab in this view and you will see a list of system defined events.
3. Click *Add Definition* to initiate creation of a new event definition.
4. In the create dialog, enter values for the namespace and name of your event, then click *Save*
5. Your new event definition will be shown under its namespace; use the edit icon to modify its fields.

## Using a service API
Once you have an event definition configured, you can use the event service API to send events of this definition.

**To create a service account**
1. In Keycloak realm administration, from *Clients*, click *Create* to create a client to use as a service account.
2. Set *Access Type* to confidential, *Service Accounts Enabled* to true, and *Web Origins* to *. Note that this is a demo configuration and you should adhere to principle of least privilege in production.
3. Select *Service Account Roles* tab, and under *Client Roles*, select `urn:ads:platform:event-service` and add the `event-sender` role.
4. Select *Credentials* tab, and take note of the *Secret*.

**To send an event manually**
1. In tenant administration, from the *Services* -> *Events* view, click the *Read the API docs* link in the aside (either on the right or the bottom).
2. In API documentation, click *Authorize*, and login using credentials for the client created above.
3. Expand the *POST /event​/v1​/events* endpoint, click *Try it out*.
4. In the *Request body* text field, set the namespace and name of the event to match your definition and the timestamp to an ISO2601 timestamp (e.g. 2021-10-02T12:00:00Z).
5. Click *Execute* to send the request.

**To send an event from your application**
1. Get an access token with the event-sender role.
    ```typescript
      const { access_token } = await fetch(`${keycloakRealmTokenUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'client_id': clientId,
          'client_secret': clientSecret,
          'grant_type': 'client_credentials'
        })
      });
    ```
2. Send the event via the event service.
    ```typescript
      await fetch(`${eventServiceUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          namespace,
          name,
          timestamp: new Date(),
          payload,
        }),
      });
    ```


This is how you can send an event in ADSP. Other services are configured and access via API in similar ways.
