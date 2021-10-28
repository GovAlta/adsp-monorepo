# Alberta Digital Service Platform (ADSP)
This project is a monorepo using [Nx](https://nx.dev).

[![Delivery CI](https://github.com/GovAlta/adsp-monorepo/actions/workflows/delivery-ci.yml/badge.svg)](https://github.com/GovAlta/adsp-monorepo/actions/workflows/delivery-ci.yml)

[![Nightly Regression](https://github.com/GovAlta/adsp-monorepo/actions/workflows/nightly.yml/badge.svg)](https://github.com/GovAlta/adsp-monorepo/actions/workflows/nightly.yml)

## Development using ADSP
See the [ADSP Development Guide](https://glowing-parakeet-0563ab2e.pages.github.io)

## Generating a new platform service
This project includes a workspace generator for creating new platform services.

```
npx nx workspace-generator adsp-service
```

## Using managed environments

Managed environments are openshift resources created and updated by the core services CI/CD pipeline ([Jenkinsfile](Jenkinsfile))
and branch build ([Jenkinsfile.dev](Jenkinsfile.dev)). Managed resources are based on templates under `.openshift/managed`
(e.x [Tenant Management API](.openshift/managed/tenant-management-api.yml)) and maintained using the `openshift.process()` and
`openshift.apply()` functions of the Jenkins openshift DSL.

The process is equivalent to the following use of `oc` cli:

```
oc project core-services-dev

oc process -f .openshift/managed/tenant-management-api.yml -p DEPLOY_TAG=dev | oc apply -l apply-dev=true
```

### Adding new manage app/service

New app/service resources can be add by creating an associated template yaml file under `.openshift/managed`.
The template represents a superset of resources across different projects and must follow the following conventions.

#### Conventions

1. Name the file after the nx app (e.g. `tenant-management-api.yml`).
2. File must contain valid openshift template that can be processed using `oc process -f template.yml`
3. Template must contain the following parameters
   1. `DEPLOY_TAG` - _ImageStreamTag_ deployed by the _DeploymentConfig_.
      The pipeline will set up each environment to deploy the associated tag (dev, test, etc.)
   1. `BUILD_TAG` - _ImageStreamTag_ published by the _BuildConfig_.
      The branch build will set up branch build to publish branch specific tag
   1. `NAME_SUFFIX` - Suffix applied to resource names. The branch build uses this to distinguish branch specific resources.
   1. `ROUTE_HOST` - Host value in the _Route_. The branch build uses this to provide distinct URLs for branch instance.
4. Template may contain additional parameters. All parameters must be optional (`required: false`) or have a default value;
   i.e. it should be possible to run `oc process` without providing the parameter value.
5. Use labels with **string value** of "true" to indicate what contexts each resource belongs in
   1. `apply-infra: "true"` - Resource is created in the infra project: _BuildConfig_ and _ImageStream_
   2. `apply-init: "true"` - Resource is created during manual provisioning of a new environment: _PersistentVolumeClaim_ and _Secret_. These will break existing environment if recreated; e.g. Secret values regenerated.
   3. `apply-branch: "true"` - Resource is created in branch specific deployments: all deployment resources plus _BuildConfig_
   4. `apply-dev: "true"` - Resource is created in the dev environment: _DeploymentConfig_, _Service_, and _Route_
   5. `apply-test: "true"` - Same as above but for test environment.
   6. `apply-staging: "true"` - Same as above but for staging environment.
   7. `apply-prod: "true"` - Same as above but for prod environment.
6. _ConfigMap_, _Secret_, and _PersistentVolume_ should only be included in branch builds. Resources managed by the pipeline may
   be destroyed by the pipeline, so any configuration or data that needs to be maintained needs to be managed manually outside the
   template.
7. All container environment variables should be bound to a _ConfigMap_ or _Secret_ so that most environment variation is
   externalized from the template.

### Updating existing managed app/service

Updates to managed environment resources is done by updating the associated template. Any direct changes to the resource in
openshift may be overwritten by pipeline execution.

### Trying changes on a branch

Changes to managed app/service templates should be tried on a branch before being merged. The branch build supports deploying
based on the templates for this purpose.

The general workflow is as follows:

1. Branch to a feature branch.
2. Generate the nx app (sub-project).
3. Create the associated template under `.openshift/managed`.
4. Manually run the branch in Jenkins using Build with Parameters
   1. Set the source ref to the branch
   2. Set the deploy_branch flag
5. Manually add any required _ConfigMap_, _Secret_, or other resource not managed via the template.
6. Verify branch specific deployment (resources with branch name as suffix).
7. Merge branch.

### Error Handling

common-core lib includes a set of predefined errors based on GoAError. The error handler in the lib can process the GoAError. To include the error handler:

```
import { createLogger, createErrorHandler } from '@core-services/core-common';
// Make sure adding the errorHandler middleware after router middleware.
const errorHandler = createErrorHandler(logger);
app.use(errorHandler)
```

Please use the **next** in the express to handle the error: [Express error handling](https://expressjs.com/en/guide/error-handling.html).

## To run in Docker Compose

```
docker-compose \
-f .compose/docker-compose.infra.yml \
-f .compose/docker-compose.event.yml
up
```

_Include additional files to run more services._

**Note regarding startup order**

Some services are dependent on readiness of rabbitmq or other services and currently readiness wait scripts are not included in
the containers. In practice, this means some services will fail on a clean start and need to be restarted.

**Note regarding Keycloak**

When `KEYCLOAK_FRONTEND_URL` is not set, Keycloak uses the request to determine the root of the URL for things like Issuer
(i.e. a token requested from the host accessing via http://localhost:8080 will have a different `iss` than a token requested from
inside the compose network). However, when `KEYCLOAK_FRONTEND_URL` is set to http://keycloak:8080/auth the Administration Console
will not be accessible from the host.

Realm can be configured via files under .compose/realms instead.
