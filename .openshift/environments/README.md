# Environment parameter overrides

Templates in `../managed` are shared by every environment. Values that need to differ by environment are
template parameters whose defaults are the production values, and files in this directory override them
for a single environment.

- `<env>/<app>.env` holds `KEY=VALUE` lines (`#` comments allowed) for `../managed/<app>.yml`. List only
  the values that differ from the template defaults.
- The deploy action (`.github/actions/deploy-app`) passes the file to `oc process --param-file` when it
  exists. Without a file, the template defaults apply.
- Production runs on the template defaults, so `prod` holds only `observability-stack.env`: Grafana's URLs
  differ in every environment and have no production default.
- `oc process` rejects unknown parameter names, so add the parameter to the template before setting it
  here. A typo fails the deploy rather than being silently ignored.

## Applying changes

Changes under `.openshift/` do not mark an app as affected, so Delivery CI does not redeploy it. The
overrides take effect on the app's next deployment, or can be applied manually.

Apps deployed by Delivery CI, using the same steps as the deploy action:

```sh
APP=pdf-service ENV=dev
oc project adsp-$ENV
oc process -f .openshift/managed/$APP.yml --param-file .openshift/environments/$ENV/$APP.env \
  -p INFRA_NAMESPACE=adsp-build -p NAMESPACE=adsp-$ENV -p DEPLOY_TAG=$ENV > $APP.$ENV.json
oc diff -f $APP.$ENV.json -l apply-$ENV=true,component!=database   # review before applying
oc apply -f $APP.$ENV.json -l apply-$ENV=true,component!=database
for d in $APP $APP-job; do
  oc get deployment/$d > /dev/null 2>&1 || continue
  oc set triggers deployment/$d --auto && oc rollout status deployment/$d && oc set triggers deployment/$d --manual
done
```

The diff shows the image as the unresolved `@<env>` tag; the trigger step resolves it, as in Delivery CI.

Redis (`component=database`) and RabbitMQ (`apply-init` only) are not applied by Delivery CI. Their
templates rely on image triggers to fill in the image, and the RabbitMQ template generates new
credentials when processed, so do not apply them from the template. Set only the resources, reading the
values from the override file:

```sh
ENV=dev
oc project adsp-$ENV

# Redis, e.g. cache-service (Recreate strategy: brief restart, data is on a PVC).
set -a; . .openshift/environments/$ENV/cache-service.env; set +a
oc set resources deployment/cache-service-redis -c redis --limits=cpu=$REDIS_CPU_LIMIT,memory=$REDIS_MEMORY_LIMIT

# RabbitMQ (pods restart one at a time).
set -a; . .openshift/environments/$ENV/event-service.env; set +a
oc set resources statefulset/event-service-rabbitmq -c rabbitmq \
  --requests=cpu=$RABBITMQ_CPU_REQUEST --limits=cpu=$RABBITMQ_CPU_LIMIT
oc set resources statefulset/event-service-rabbitmq -c rm-erlang-cookie --requests=cpu=$RABBITMQ_INIT_CPU_REQUEST
```

The observability stack is deployed by `.github/workflows/observability.yml`, including changes to its
override files; see `../observability/README.md`.

## dev and uat right-sizing

The dev and uat overrides reduce CPU reserved through requests and limits, which was close to the
namespace quotas (requests ~85% of 8 cores, limits ~92% of 32 cores) while actual usage was well under
1 core. Memory requests were roughly equal to actual usage, so memory is only reduced where usage was
far below the limit and an OOM would be harmless. No CPU request is set below the 20m minimum.

Left unchanged on purpose:

| Workload                        | Reason                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| pdf-service limits              | Raised to fix Puppeteer generation failures.                                             |
| pii-service memory              | Uses ~930Mi of its 1Gi limit.                                                            |
| file-av-scanner                 | Scans are bursty, and ClamAV needs about twice its resident memory to reload signatures. |
| RabbitMQ memory                 | Coupled to `vm_memory_high_watermark`; publishers block when it is reached.              |
| Prometheus and collector memory | Prometheus has OOMKilled at 2Gi; the collector limit is paired with `memory_limiter`.    |
| Front-end apps                  | nginx gzips responses on the fly, so a lower CPU limit would slow page loads.            |
| Other Node services (20m/100m)  | Already at the 20m minimum request; the 100m limit leaves headroom for startup.          |

## Production replicas

`tenant-management-gateway`, `project-planner-service`, `project-planner-app` and the
`dashboard-metrics` API take a `REPLICAS` parameter. It defaults to 2 so a node drain does not take
them down in production; dev and uat override it to 1. `tenant-management-api`, `form-service` and
`file-service` have a PodDisruptionBudget with `maxUnavailable: 1` on their API pods.

These stay at 1 replica on purpose:

| Workload                                         | Reason                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| `*-redis`                                        | Standalone Redis without replication; some use a ReadWriteOnce volume. |
| `audit-service-job`, `tenant-management-api-job` | In-process cron schedulers; a second pod would run every job twice.    |
| Other `*-job` Deployments                        | Run scheduled jobs in process, such as status-service health checks.   |
| `file-av-scanner`                                | ClamAV is memory-heavy and uses the Recreate strategy.                 |
