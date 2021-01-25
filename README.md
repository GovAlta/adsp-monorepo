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

# To run in Docker Compose
```
docker-compose \
-f .compose/docker-compose.infra.yml \
-f .compose/docker-compose.event.yml
up
```

*Include additional files to run more services.*

**Note regarding startup order**

Some services are dependent on readiness of rabbitmq or other services and currently readiness wait scripts are not included in the containers. In practice, this means some services will
fail on a clean start and need to be restarted.

**Note regarding Keycloak**

When `KEYCLOAK_FRONTEND_URL` is not set, Keycloak uses the request to determine the root of the URL for things like Issuer (i.e. a token requested from the host accessing via http://localhost:8080 will have a different `iss` than a token requested from inside the compose network). However, when `KEYCLOAK_FRONTEND_URL` is set to http://keycloak:8080/auth the Administration Console will not be accessible from the host.

Realm can be configured via files under .compose/realms instead.
