This project was generated using [Nx](https://nx.dev).

[File Service](./apps/file-service/README.md)
[Tenant Management Frontend WebApp](./apps/tenant-management-webapp/README.md)
[Tenant Management Backend API](./apps/tenant-management-api/README.md)

# To build in openshift/minishift

Log into oc using credentials at https://console.os99.gov.ab.ca:8443/


you can either use the files provided in .openshift folder
  (core-services-dev.yaml and core-services-infra.yaml)

or you can export from openshift:

  oc project core-services-dev
  oc export all --as-template=core-services-dev > core-services-dev.yaml
  oc get -o yaml --export secrets > dev-secrets.yaml

  oc project core-services-infra
  oc export all --as-template=core-services-infra> core-services-infra.yaml
  oc get -o yaml --export secrets > infra-secrets.yaml

  if you export all -> delete all references to host: xxx.xxx.xxx.xxx in both core-services-dev.yaml and core-sevices-infra.yaml


important: you will have to export secrets regardless

## Create core-services-dev project
import core-services-dev.yaml and dev-secrets.yaml into your project

## Create core-services-infra project
import core-services-infra.yaml and infra-secrets.yaml into your project


## Additional changes required

go to Storage in core-services-infra

click 'Create Storage'
name: 'jenkins-storage'
Size: 20gb

go to Storage in core-services-dev

  -> click 'Create Storage'
    name: 'file-service-mongodb'
    Size: 1gb

  -> click 'Create Storage'
    name 'file-service'
    Size: 1gb

for both core-services-infra / core-services-dev

-> go to Resources
  -> click on Membership
     -> Service Accounts
        -> Edit Membership

        add core-services-infra / Jenkins -> edit




then you can start the pipeline

# Using managed environments
Managed environments are openshift resources created and updated by the core services CI/CD pipeline ([Jenkinsfile](Jenkinsfile))
and branch build ([Jenkinsfile.dev](Jenkinsfile.dev)). Managed resources are based on templates under `.openshift/managed`
(e.x [Tenant Management API](.openshift/managed/tenant-management-api.yml)) and maintained using the `openshift.process()` and
`openshift.apply()` functions of the Jenkins openshift DSL.

The process is equivalent to the following use of `oc` cli:
```
oc project core-services-dev

oc process -f .openshift/managed/tenant-management-api.yml -p DEPLOY_TAG=dev | oc apply -l apply-dev=true
```

## Adding new manage app/service
New app/service resources can be add by creating an associated template yaml file under `.openshift/managed`.
The template represents a superset of resources across different projects and must follow the following conventions.

### Conventions
1. Name the file after the nx app (e.g. `tenant-management-api.yml`).
2. File must contain valid openshift template that can be processed using `oc process -f template.yml`
3. Template must contain the following parameters
   1. `DEPLOY_TAG` - *ImageStreamTag* deployed by the *DeploymentConfig*.
   The pipeline will set up each environment to deploy the associated tag (dev, test, etc.)
   1. `BUILD_TAG` - *ImageStreamTag* published by the *BuildConfig*.
   The branch build will set up branch build to publish branch specific tag
   1. `NAME_SUFFIX` - Suffix applied to resource names. The branch build uses this to distinguish branch specific resources.
   2. `ROUTE_HOST` - Host value in the *Route*. The branch build uses this to provide distinct URLs for branch instance.
4. Template may contain additional parameters. All parameters must be optional (`required: false`) or have a default value;
   i.e. it should be possible to run `oc process` without providing the parameter value.
5. Use labels with **string value** of 'true' to indicate what contexts each resource belongs in
   1. `apply-infra: 'true'` - Resource is created in the infra project: *BuildConfig* and *ImageStream*
   2. `apply-branch: 'true'` - Resource is creaated in branch specific deployments: all deployment resources plus *BuildConfig*
   3. `apply-dev: 'true'` - Resource is created in the dev environment: *DeploymentConfig*, *Service*, and *Route*
   4. `apply-test: 'true'` - Same as above but for test environment.
   5. `apply-staging: 'true'` - Same as above but for staging environment.
   6. `apply-prod: 'true'` - Same as above but for prod environment.
6. *ConfigMap*, *Secret*, and *PersistentVolume* should only be included in branch builds. Resources managed by the pipeline may
   be destroyed by the pipeline, so any configuration or data that needs to be maintained needs to be managed manually outside the
   template.
7. All container environment variables should be bound to a *ConfigMap* or *Secret* so that most environment variation is
   externalized from the template.

## Updating existing managed app/service
Updates to managed environment resources is done by updating the associated template. Any direct changes to the resource in
openshift may be overwritten by pipeline execution.

## Trying changes on a branch
Changes to managed app/service templates should be tried on a branch before being merged. The branch build supports deploying
based on the templates for this purpose.

The general workflow is as follows:

1. Branch to a feature branch.
2. Generate the nx app (sub-project).
3. Create the associated template under `.openshift/managed`.
4. Manually run the branch in Jenkins using Build with Parameters
   1. Set the source ref to the branch
   2. Set the deploy_branch flag
5. Manually add any required *ConfigMap*, *Secret*, or other resource not managed via the template.
6. Verify branch specific deployment (resources with branch name as suffix).
7. Merge branch.


# To run in Docker Compose
```
docker-compose \
-f .compose/docker-compose.infra.yml \
-f .compose/docker-compose.event.yml
up
```

*Include additional files to run more services.*

**Note regarding startup order**

Some services are dependent on readiness of rabbitmq or other services and currently readiness wait scripts are not included in
the containers. In practice, this means some services will fail on a clean start and need to be restarted.

**Note regarding Keycloak**

When `KEYCLOAK_FRONTEND_URL` is not set, Keycloak uses the request to determine the root of the URL for things like Issuer
(i.e. a token requested from the host accessing via http://localhost:8080 will have a different `iss` than a token requested from
inside the compose network). However, when `KEYCLOAK_FRONTEND_URL` is set to http://keycloak:8080/auth the Administration Console
will not be accessible from the host.

Realm can be configured via files under .compose/realms instead.
