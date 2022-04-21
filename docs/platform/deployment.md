---
layout: page
title: Platform deployment
nav_order: 3
parent: Platform development
---

# Platform deployment

TODO:This should be captured in scripts for automated setup.

This repository includes manifests for deployment in OpenShift under `/.openshift`. The micro-services
communicate over APIs and RabbitMQ, and so deployment into other hosting environments is also possible.

## Prerequisites

A few prerequisites are needed to set up an ADSP deployment:

1. [Keycloak](https://www.keycloak.org/) is used as an IAM solution. Realms provide tenants with user access management under their own administrative control.
2. [RabbitMQ](https://www.rabbitmq.com/) is used as a messaging framework and work queue in some platform services.
3. Databases for platform micro-services. Containerized databases are not included in the deployment manifests, and managed options are recommended.

## Keycloak configuration

### Master realm configuration

The tenant service creates realms for new tenants using a service account.

1. Create a confidential client with a service account.
2. Grant the service account role(s) to create and modify realms.

### Core realm configuration

Platform micro-services make requests under a non-tenant 'core' context. This is handled with a 'core' realm in Keycloak.

1. Create a 'core' realm in Keycloak.
2. Create public *client* with *Standard Flow* enabled for tenant administration application: `urn:ads:platform:tenant-admin-app`.
3. Create confidential *clients* with service accounts for `urn:ads:platform:subscriber-gateway` and `urn:ads:platform:api-docs-app`.
4. Create confidential *clients* with service accounts for backend micro-services including:
   - `urn:ads:platform:tenant-service`
   - `urn:ads:platform:event-service`
   - `urn:ads:platform:value-service`
   - ...
5. Create service *client roles*:
   - In `urn:ads:platform:value-service`, create `value-reader` and `value-writer` roles.
   - In `urn:ads:platform:event-service`, create `event-sender` role.
   - In `urn:ads:platform:configuration-service`, create  `configured-service` role.
   - In `urn:ads:platform:notification-service`, create `subscription-app` role.
   - In `urn:ads:platform:verify-service`, create `code-generator` and `code-verifier` roles.
   - In `urn:ads:platform:tenant-service`, create `platform-service` role, enable *composite roles*, and add `event-sender` and `configured-service` client roles from above.
6. Assign roles to *clients*
   - Grant the service accounts the `platform-service` role.
   - Grant `urn:ads:platform:event-service` the `value-writer` role.
   - Grant `urn:ads:platform:notification-service` the `code-generator` and `code-verifier` roles.
   - Grant `urn:ads:platform:subscriber-gateway` and `urn:ads:platform:form-service` the `subscription-app` role.


## RabbitMQ configuration
Some platform services communicate over RabbitMQ. The exchange and queue configuration required is contained in the code, but manual configuration is necessary to create the accounts. All accounts should access a common vhost in RabbitMQ.

1. Create accounts for platform services including:
   - event-service
   - notification-service
   - push-service
   - file-service

Additional services can be modified to use RabbitMQ for configuration cache invalidation.

## OpenShift configuration

References for configuration in the form of ConfigMaps and Secrets are included in the `/.openshift/configuration` directory. These resources need to be manually created within the environment with configuration values. Other deployment resources are contained in templates under the `/.openshift/managed` directory and are automatically applied by the `deliver-ci` workflow.

1. Create projects for 'build', 'dev', 'uat', and 'prod' environments in OpenShift.
2. Set appropriate values in the ConfigMaps and Secrets and apply to environments.
3. Create a service account in 'build' with edit permission to other projects for the pipeline.
4. Process and apply managed templates, and/or set service account token in GitHub for the pipeline.

