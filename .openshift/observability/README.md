# Observability

This folder contains a Tempo-based tracing stack intended to be run as a
platform capability on OpenShift. Application teams should emit OTLP traces to
the shared collector endpoint and should not deploy their own tracing stack.

Files in this folder:

- `observability-stack.yml`: one-template deployment of Tempo + Collector + Prometheus + Grafana.
- `render-stack.sh`: renders the template for dev, uat or prod with the parameters it is deployed with.

## Topology

Recommended topology per environment:

`services -> otel-collector -> tempo -> grafana`

Run one stack per environment, owned by the platform team.

## Components

`observability-stack.yml` deploys all three components together:

- Tempo with persistent local storage and OTLP ingest (`4317`/`4318`)
- OpenTelemetry Collector with retry queue, batching, and environment tagging
- Grafana with a pre-provisioned Tempo datasource and route
- A Cluster Prometheus datasource for OpenShift cluster monitoring, scoped to the namespace; see
  [Cluster metrics](#cluster-metrics)

Application services should target the collector service, not Tempo directly.

## Deploy

`.github/workflows/observability.yml` deploys the stack, the same way `.github/workflows/monitoring.yml`
applies alerting:

| Trigger | Deploys |
|---|---|
| Pull request changing the template, `render-stack.sh`, an `observability-stack.env` or the workflow | Nothing. Renders the stack for dev, uat and prod. |
| Push to `main` changing the template, `render-stack.sh` or the workflow | dev, then uat after `Staging-gate` approval. Prod is skipped with a notice. |
| Push to `main` changing `.openshift/environments/<env>/observability-stack.env` | That environment (dev, or uat after approval). |
| Manual run (Actions > Observability stack > Run workflow) on `main` | The chosen environment. The only way to deploy prod. |

The deploy jobs run in the `Dev`, `Staging` and `Production` GitHub Environments and log in with their
`ARO_SERVER` and `ARO_TOKEN` secrets, the account Delivery CI deploys with. Deploying needs an account
that can update ImageStreams in `adsp-build`, which personal accounts usually cannot.

Each deploy job:

1. Renders the template with `render-stack.sh <env>` and dry-runs it against `adsp-<env>`.
2. Points the environment's ImageStream tags in `adsp-build` at the source images (`oc tag`), which starts
   their import, and waits for it, failing if an import does not succeed.
3. Applies everything except the ImageStreams and the RoleBinding to `adsp-<env>`, with each Deployment's
   image set to the imported digest so it rolls once.
4. Restarts a Deployment whose ConfigMap changed but whose pods were not replaced by the apply. The
   components, the collector included, read their config only at startup.
5. Waits for the four Deployments to roll out and checks that they run the imported images.

It does not back up Grafana's database or apply the dashboards; see [Dashboards](#dashboards).

The deploy account has `edit` in `adsp-<env>`, which cannot read or write RoleBindings, so the job skips
RoleBinding `grafana-metrics-view` (see [Cluster metrics](#cluster-metrics)). It exists in dev, uat and
prod. A namespace admin applies it when it is new or changes:

```sh
ENV=dev
.openshift/observability/render-stack.sh $ENV | jq '.items |= map(select(.kind == "RoleBinding"))' | oc apply -n adsp-$ENV -f -
```

### Parameters

`render-stack.sh <env>` renders the template with:

- `ENVIRONMENT_NAME=<env>`, `NAMESPACE=adsp-<env>` and `INFRA_NAMESPACE=adsp-build`.
- `IMAGE_TAG=<env>`. The ImageStreams in `adsp-build` are shared by every environment, so with a shared
  tag such as `latest`, importing a new image for dev would also roll uat and prod through their image
  triggers. Each environment has its own tag instead. For the same reason the workflow sets tags with
  `oc tag` rather than applying the ImageStream objects: applying one environment's ImageStream would
  remove the other environments' tags.
- `.openshift/environments/<env>/observability-stack.env`, which holds the values that differ by
  environment:

| Parameter | dev | uat | prod |
|---|---|---|---|
| `GRAFANA_ROOT_URL` | `https://grafana-adsp-dev.apps.aro-01.int.gov.ab.ca` | `https://grafana-adsp-uat.apps.aro-01.int.gov.ab.ca` | `https://grafana-adsp-prod.apps.aro-01.int.gov.ab.ca` |
| `GRAFANA_OAUTH_*_URL` (core realm) | `access.adsp-dev.gov.ab.ca` | `access-uat.alberta.ca` | `access.alberta.ca` |
| `GRAFANA_DISABLE_LOGIN_FORM` | `true` | `false` | `false` |
| CPU requests and limits | reduced | reduced | template defaults |

`GRAFANA_ROOT_URL` is the host OpenShift generates for the `grafana` route. If it is unset, OAuth login
redirects to `localhost`; `render-stack.sh` refuses to render OAuth without https URLs.

Grafana credentials and OAuth client credentials are sourced from an existing secret
(`GRAFANA_SECRET_NAME`). The stack template does not generate this secret.

Reference secret manifest:

- `.openshift/configuration/grafana.yml`

### Images

The template imports source images into ImageStreams in `INFRA_NAMESPACE` and
deployments pull from the internal OpenShift registry to avoid direct Docker Hub pulls.
By default, scheduled imports are disabled to minimize upstream registry requests.
Set `IMAGE_IMPORT_SCHEDULED=true` only if you want periodic automatic refreshes.

Source images and registries (the `*_IMAGE` template parameters):

| Component | Source image |
|---|---|
| Tempo | `docker.io/grafana/tempo:2.10.10` |
| OpenTelemetry Collector | `ghcr.io/open-telemetry/opentelemetry-collector-releases/opentelemetry-collector-contrib:0.166.0` |
| Prometheus | `quay.io/prometheus/prometheus:v3.16.0` |
| Grafana | `docker.io/grafana/grafana:12.4.16` |

Grafana Labs publishes Tempo and Grafana images only on Docker Hub, so those two imports still pull
from `docker.io`. Upgrading Grafana migrates its database on the `grafana-storage` volume and cannot
be rolled back by changing the image tag; back up `/var/lib/grafana/grafana.db` first if its data
matters.

The `latest` tags that the stacks used before the workflow are left in place; nothing tracks them once
every environment has been deployed by the workflow.

### Deploying manually

Without the workflow, an account that can update ImageStreams in `adsp-build` can do the same steps by
hand. Tag and import the images, then apply the rest:

```sh
ENV=dev
.openshift/observability/render-stack.sh $ENV > observability.$ENV.json
jq -r '.items[] | select(.kind == "ImageStream") | "\(.metadata.name):\(.spec.tags[0].name) \(.spec.tags[0].from.name)"' \
  observability.$ENV.json | while read -r tag source; do
  oc tag -n adsp-build --source=docker "$source" "$tag" --reference-policy=local   # starts the import
done
oc get istag -n adsp-build tempo:$ENV otel-collector:$ENV prometheus:$ENV grafana:$ENV   # wait until all four resolve
# Add RoleBinding objects back if the account is a namespace admin.
jq '.items |= map(select(.kind | IN("ImageStream", "RoleBinding") | not))' observability.$ENV.json > objects.$ENV.json
oc diff -n adsp-$ENV -f objects.$ENV.json   # review before applying
oc apply -n adsp-$ENV -f objects.$ENV.json
oc rollout restart deployment/otel-collector -n adsp-$ENV   # if only its ConfigMap changed
```

`NAMESPACE` must be the namespace being applied to. It has no default, so omitting it fails instead of
scoping one environment's Grafana to another environment's namespace.

To re-import an environment's images on demand (instead of periodic polling), for example dev:

```sh
for name in tempo otel-collector prometheus grafana; do oc import-image -n adsp-build $name:dev; done
```

`oc import-image` refuses to change a tag's source; change the `*_IMAGE` parameter and deploy, or use
`oc tag --source=docker <image> <name>:<env>`.
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

## Cluster metrics

The `Cluster Prometheus` datasource (uid `cluster-prometheus`) reads pod, container and deployment
metrics from OpenShift cluster monitoring: kube-state-metrics (`kube_pod_*`, `kube_deployment_*`,
`kube_resourcequota`) and cAdvisor (`container_cpu_*`, `container_memory_*`, `container_network_*`).
The SDK metrics are not there; they stay in the `Prometheus` datasource.

It queries `https://thanos-querier.openshift-monitoring.svc:9092`, the tenancy port. Port 9091 needs
cluster-wide `cluster-monitoring-view`, which an environment's Grafana should not have. Port 9092
requires a `namespace` query parameter, checks that the token can view that namespace, and injects
`namespace="<NAMESPACE>"` into every selector. So:

- Queries need no namespace selector, and cannot read another namespace. Asking for one returns 403.
- The datasource must use `GET`. Access is checked with the verb mapped from the HTTP method, and the
  `create` that `POST` maps to is not in `view`.
- `/api/v1/query`, `/query_range`, `/labels`, `/label/<name>/values` and `/series` work, so template
  variables (`label_values(...)`) do. `/api/v1/metadata` returns 404, so the query editor shows no
  metric help text.

The template creates what the datasource authenticates with:

| Object | Purpose |
|---|---|
| ServiceAccount `${GRAFANA_NAME}-metrics` | Identity for the queries. Not the Grafana pod's own account, so the pod gains no API access. |
| RoleBinding `${GRAFANA_NAME}-metrics-view` | ClusterRole `view` in `NAMESPACE` only. |
| Secret `${GRAFANA_NAME}-metrics-token` | Long-lived `kubernetes.io/service-account-token`; the token controller fills in `token`. |
| ConfigMap `${GRAFANA_NAME}-service-ca` | Annotated `service.beta.openshift.io/inject-cabundle`, so it receives the service CA that signs thanos-querier's certificate. TLS is verified, not skipped. |

The account, binding and token Secret are created in `NAMESPACE` explicitly, so the binding always
grants to an account in its own namespace. The token and CA reach Grafana as the
`CLUSTER_METRICS_TOKEN` and `CLUSTER_METRICS_CA_CERT` environment variables, which the datasource file
interpolates. Grafana reads them only at startup: after the token Secret is recreated or the service
CA rotates, restart it with `oc rollout restart deployment/grafana`.

To check the datasource, open it under Connections > Data sources and choose Test, or run a query in
Explore such as `sum(kube_pod_status_phase{phase="Running"})`. The `adsp-workload-health` dashboard
(see [Dashboards](#dashboards)) is built on it.

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
| `adsp-workload-health.json` | Are pods running, restarting or short of replicas, and what CPU, memory and network do they use? From `Cluster Prometheus`, so it covers every workload in the namespace, not only SDK services. |

`adsp-event-bus-rabbitmq.json` covers only per-node aggregates, because
`prometheus.return_per_object_metrics` is deliberately off -- per-object series scale with
queues x channels x connections. It can show that the bus is backing up but not which queue is
responsible; use the management UI on the affected node for that.

`adsp-workload-health.json` works in any environment unchanged, because the datasource supplies
the namespace. Its Namespace CPU % is usage against the ResourceQuota `limits.cpu`, and reads No data
in a namespace without one. The replicas table lists Deployments only; DeploymentConfigs and
StatefulSets are not in it. The Network panel draws receive above the axis and transmit below it,
per workload: pods are mapped to their Deployment through `kube_pod_owner` and
`kube_replicaset_owner`, to their DeploymentConfig through `kube_replicationcontroller_owner`, and
otherwise to their direct owner (a StatefulSet, for example), so no pod is dropped. The Deployment
filter lists Deployments only, so DeploymentConfigs and StatefulSets appear in the panel only under
All.

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
