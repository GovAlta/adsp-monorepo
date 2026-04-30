# Observability

This folder contains a Tempo-based tracing stack intended to be run as a
platform capability on OpenShift. Application teams should emit OTLP traces to
the shared collector endpoint and should not deploy their own tracing stack.

Files in this folder:

- `stack.yml`: one-template deployment of Tempo + Collector + Grafana.

## Topology

Recommended topology per environment:

`services -> otel-collector -> tempo -> grafana`

Run one stack per environment, owned by the platform team.

## Components

`stack.yml` deploys all three components together:

- Tempo with persistent local storage and OTLP ingest (`4317`/`4318`)
- OpenTelemetry Collector with retry queue, batching, and environment tagging
- Grafana with a pre-provisioned Tempo datasource and route

Application services should target the collector service, not Tempo directly.

## Deploy

Fastest path: deploy the whole stack with one template.

```sh
oc process -f .openshift/observability/stack.yml \
  -p ENVIRONMENT_NAME=dev \
  -p INFRA_NAMESPACE=core-services-infra \
  -p IMAGE_TAG=latest \
  -p IMAGE_IMPORT_SCHEDULED=false \
  -p GRAFANA_SECRET_NAME=grafana \
  -p GRAFANA_OAUTH_ENABLED=true \
  -p GRAFANA_ROOT_URL=https://grafana-<env-route-host> \
  -p GRAFANA_OAUTH_AUTH_URL=https://access.<env-domain>/auth/realms/core/protocol/openid-connect/auth \
  -p GRAFANA_OAUTH_TOKEN_URL=https://access.<env-domain>/auth/realms/core/protocol/openid-connect/token \
  -p GRAFANA_OAUTH_API_URL=https://access.<env-domain>/auth/realms/core/protocol/openid-connect/userinfo \
  | oc apply -f -
```

The template imports source images into ImageStreams in `INFRA_NAMESPACE` and
deployments pull from the internal OpenShift registry to avoid direct Docker Hub pulls.
By default, scheduled imports are disabled to minimize upstream registry requests.
Set `IMAGE_IMPORT_SCHEDULED=true` only if you want periodic automatic refreshes.

The account applying the template must be allowed to create/update ImageStreams in
`INFRA_NAMESPACE`.

Grafana credentials and OAuth client credentials are sourced from an existing secret
(`GRAFANA_SECRET_NAME`). The stack template does not generate this secret.

Reference secret manifest:

- `.openshift/configuration/grafana.yml`

To refresh imported images on demand (instead of periodic polling):

```sh
oc import-image -n core-services-infra tempo:latest --from=grafana/tempo:2.7.2 --confirm
oc import-image -n core-services-infra otel-collector:latest --from=ghcr.io/open-telemetry/opentelemetry-collector-releases/opentelemetry-collector-contrib:0.125.0 --confirm
oc import-image -n core-services-infra grafana:latest --from=grafana/grafana:11.5.2 --confirm
```

To see the generated Grafana route host:

```sh
oc get route grafana
```

To retrieve the current Grafana admin password from the existing secret:

```sh
oc get secret grafana -o jsonpath='{.data.admin-password}' | base64 --decode && echo
```

If OAuth login redirects to `localhost`, ensure `GRAFANA_ROOT_URL` is set when
processing the template and restart Grafana.

## Endpoints

Application services should export traces to:

- OTLP gRPC: `http://otel-collector:4317`
- OTLP HTTP: `http://otel-collector:4318`

Grafana reaches Tempo internally at:

- `http://tempo:3200`

## Evaluation Notes

- The stack is designed to run as a platform-owned service.
- Tempo uses a persistent volume in this configuration so traces survive pod restarts.
- For larger-scale production, the next step would typically be distributed Tempo with object storage.
- Suggested evaluation path: deploy the stack in one environment, point one or two services at the collector, validate HTTP and RabbitMQ trace flows, then standardize SDK configuration for all teams.
