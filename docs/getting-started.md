---
layout: page
title: Getting started
nav_order: 1
---

# Getting started
Product teams can get started by accessing an existing tenant or creating a new tenant. Each tenant represents a zone of administrative control and generally products within a common service area can share a tenant.

**To create a new tenant**
1. Go to [ADSP Home](https://adsp.alpha.alberta.ca);
2. click the *Get Started* button. (You may require approval from the platform team to complete the tenant creation process.)
3. Congratulations, you have a tenant in ADSP.

## Overview of tenant administration

## Administering your tenant
After your tenant is created, you will have access to the tenant administration application. As the original creator of a tenant, you can login from the landing page of ADSP to access tenant administration.

For other team members, note the instructions and tenant specific login url shown in the aside on the *Dashboard* view (either on the right or the bottom). Team members can login via this url to provision their user in the tenant realm; they will start with no access to tenant administration.

**To grant administration access to team members**
1. Select *Services* -> *Access* in the navigation menu.
2. Use the *Keycloak Admin Portal* link to access Keycloak administration for your tenant realm.
3. Select *Manage* -> *Users* and click the *View all users* button.
4. Select the team member you wish to grant access to, and select *Role Mappings*.
5. Under *Client Roles*, select `urn:ads:platform:tenant-service` and add the `tenant-admin`.
6. Your team member can now access tenant administration via the tenant specific login url.

## Configuring a platform service

TODO: Add details of configuring one of the platform services here.

## Using a service API

TODO: Add details of how to use a platform API.
