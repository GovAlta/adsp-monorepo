# Observability

This folder contains a Tempo-based tracing stack intended to be run as a
platform capability on OpenShift. Application teams should emit OTLP traces to
the shared collector endpoint and should not deploy their own tracing stack.

Files in this folder:

- `observability-stack.yml`: one-template deployment of Tempo + Collector + Grafana.

## Topology

Recommended topology per environment:

`services -> otel-collector -> tempo -> grafana`

Run one stack per environment, owned by the platform team.

## Components

`observability-stack.yml` deploys all three components together:

- Tempo with persistent local storage and OTLP ingest (`4317`/`4318`)
- OpenTelemetry Collector with retry queue, batching, and environment tagging
- Grafana with a pre-provisioned Tempo datasource and route

Application services should target the collector service, not Tempo directly.

## Deploy

Fastest path: deploy the whole stack with one template.

```sh
oc process -f .openshift/observability/observability-stack.yml \
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

## Metrics from the SDK

Every service built on `@abgov/adsp-service-sdk` emits the series below when `initializePlatform` is
given a metrics endpoint. Names are the Prometheus form after OTLP translation: dots become
underscores, counters gain `_total`, and a millisecond histogram gains `_milliseconds` plus the usual
`_bucket`/`_count`/`_sum`. Labels are likewise underscored, so `adsp.tenant` is queried as
`adsp_tenant`.

| Metric | Labels | Answers |
|---|---|---|
| `http_server_request_count_total` | `http_request_method`, `http_route`, `http_response_status_code`, `adsp_tenant` | Request rate, by route and status. |
| `http_server_request_duration_milliseconds` | as above | Latency per route. |
| `http_server_request_errors_total` | as above | 5xx rate. 4xx is not an error here; the caller owns those. |
| `http_server_request_active` | `http_request_method` | In-flight requests. Method only -- the route is not known when a request starts, and the increment and decrement have to carry identical labels. |
| `adsp_benchmark_duration_milliseconds` | `benchmark_name`, `http_request_method`, `http_route`, `adsp_tenant` | Where time goes inside a request: operation handling, tenant and configuration retrieval, validation. |
| `adsp_cache_lookups_total` | `adsp_cache_name`, `adsp_cache_result` | Whether the SDK's caches are working. `adsp_cache_name` is one of `configuration`, `directory`, `tenant`, `issuer`, `jwks-client`, plus any a service registers itself. |
| `adsp_job_duration_milliseconds` | `adsp_job_name`, `adsp_job_result` | Scheduled job runtime, run rate (`_count`) and failure rate (`adsp_job_result="error"`). |
| `platform_healthcheck_duration_milliseconds` | `cache_hit` | Cost of the health endpoint, split by whether it answered from its 120s cache. |
| `platform_healthcheck_dependency_status` | `dependency` | Per-dependency health, 1 healthy and 0 unhealthy. |
| `platform_healthcheck_dependency_failures_total` | `dependency` | Count of failed dependency checks. |

Label sets are deliberately small and fixed. Route labels come from the Express route template, never
the request path, and tenants appear as a single `adsp_tenant` label combining name and id rather than
as a raw URN -- a URN contains regex metacharacters that Grafana's `:regex` formatter escapes into
PromQL that will not parse.

Hit ratio per cache:

```promql
sum by (adsp_cache_name) (rate(adsp_cache_lookups_total{adsp_cache_result="hit"}[5m]))
  / sum by (adsp_cache_name) (rate(adsp_cache_lookups_total[5m]))
```

Jobs that failed in the last day:

```promql
sum by (service_name, adsp_job_name) (increase(adsp_job_duration_milliseconds_count{adsp_job_result="error"}[1d])) > 0
```

Beware `rate()` and `increase()` across a deploy: a restart resets the counters and these functions
extrapolate the gap, which has produced findings off by two orders of magnitude here more than once.
Confirm anything surprising against the raw counter delta before believing it.

No dashboard covers `adsp_cache_lookups_total` or `adsp_job_duration_milliseconds` yet.

## Dashboards

`dashboards/` holds the Grafana dashboards as JSON, and they are provisioned rather than imported by
hand. `observability-stack.yml` mounts two ConfigMaps into Grafana:

- `grafana-dashboard-provider` -- the provisioning provider config, inline in `observability-stack.yml`, mounted at
  `/etc/grafana/provisioning/dashboards`.
- `grafana-dashboards` -- the dashboard JSON itself, mounted at `/etc/grafana/dashboards`. This one is
  built from the files in this directory rather than inlined, because ~100KB of JSON in the template
  would make it unreadable. The volume is marked optional, so Grafana starts even before it exists.

Apply or update the dashboards with:

```sh
tools/observability/apply-dashboards.sh adsp-dev
```

The script validates each file against the conventions below and fails rather than shipping something
Grafana would reject. It is idempotent, so it is safe to re-run.

UI edits are permitted (`allowUiUpdates: true`) so panels can be iterated on, but the ConfigMap is
reloaded on pod restart and every 60s, so anything not exported back into this directory is eventually
overwritten. Export and commit when you are happy with a change.

| File | Answers |
|---|---|
| `adsp-service-overview.json` | Is a service healthy, and which routes are slow or failing? |
| `configuration-service-performance.json` | The same, narrowed to configuration-service, plus its internal benchmark phases. |
| `adsp-service-dependencies.json` | What is a service waiting on? Outbound latency per callee, service graph edges, event bus depth. |
| `adsp-event-bus-rabbitmq.json` | Is the event bus about to block, and are domain events flowing without loss? Broker-side view. |

`adsp-event-bus-rabbitmq.json` covers only per-node aggregates, because
`prometheus.return_per_object_metrics` is deliberately off -- per-object series scale with
queues x channels x connections. It can show that the bus is backing up but not which queue is
responsible; use the management UI on the affected node for that.

### Conventions

Keep these so the files stay diffable:

- **Filename is the dashboard `uid`**, kebab-case. The uid is the stable identifier Grafana uses in
  links and provisioning; the title is not. Grafana's own export adds a timestamp suffix and spaces,
  so rename before committing.
- **`id` must be `null`.** Grafana's export writes its own instance-local numeric id, which collides
  when the file is imported into a different Grafana. `null` means "create new".
- **No `version` key.** Grafana increments it on every save, so leaving it in makes every re-export
  a diff even when nothing changed.

After exporting from the UI, normalise before committing with
`tools/observability/normalize-dashboard.mjs <exported-file>`.

### Template variables

Interpolate with `${var:pipe}`, never `${var:regex}`. The regex formatter backslash-escapes regex
metacharacters and PromQL rejects escapes such as `\(` and `\.`, so a label value containing a dot
or a bracket makes the panel fail to parse rather than return no data. Set `allValue` to `.*` on
multi-select variables so "All" also matches series where the label is absent.
