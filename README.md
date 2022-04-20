# Alberta Digital Service Platform (ADSP)
ADSP is a platform of micro-services with a model for tenancy and a unified administration application for platform services. It includes micro-services and micro-apps that provide platform capabilities as well as libraries to support the rapid development of platform and tenant components.

This monorepo uses the [Nx](https://nx.dev) toolstack.

[![Delivery CI](https://github.com/GovAlta/adsp-monorepo/actions/workflows/delivery-ci.yml/badge.svg)](https://github.com/GovAlta/adsp-monorepo/actions/workflows/delivery-ci.yml)

[![Nightly Regression](https://github.com/GovAlta/adsp-monorepo/actions/workflows/nightly.yml/badge.svg)](https://github.com/GovAlta/adsp-monorepo/actions/workflows/nightly.yml)

## Development using ADSP
See the [ADSP Development Guide](https://glowing-parakeet-0563ab2e.pages.github.io)

## Setting up a deployment
See the [Deployment - ADSP Development Guide](https://glowing-parakeet-0563ab2e.pages.github.io/platform/deployment.html)


## To run in Docker Compose
Note that Docker compose based deployment is for local testing purposes only and YMMV.

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
