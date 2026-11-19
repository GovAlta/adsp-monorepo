# ADSP alerting

Alert rules and notification routing for the `adsp-dev`, `adsp-uat` and `adsp-prod` namespaces.
Alerts are delivered by email to `TI-DDDOSPFullStackDevelopers@gov.ab.ca` and to the Slack channel
of each environment.

```
.openshift/monitoring/
├── rules/<service>.yaml        # Alert rules, one OpenShift Template per service
├── alertmanager-config.yaml    # AlertmanagerConfig alertmanager-<namespace> (email + Slack)
├── params/<env>.env            # Parameters shared by every template, per environment
└── render.sh                   # Renders one environment; used by CI and locally
```

Every file is an OpenShift Template processed with `params/<env>.env`, so the same rule or
receiver ships to every environment and only parameters differ. Templates ignore parameters they
do not declare, so per-service thresholds (for example `FORM_SERVICE_RESTART_THRESHOLD=3`) live in
the same params files. Param files treat `#` as a comment: values must not contain it, which is why
`SLACK_CHANNEL` omits the leading `#`.

## Routing

| Severity           | First notification | Repeat while firing |
| ------------------ | ------------------ | ------------------- |
| `critical`         | immediately        | 30m                 |
| `error`, `warning` | after 1m           | 2h                  |
| other or missing   | after 30s          | 4h                  |
| `info`             | not notified       | -                   |

- Alerts are grouped by `alertname`, `service` and `kubernetes_pod_name`.
- A firing `critical` alert suppresses `error` and `warning` alerts for the same service and pod.
- Resolved alerts are notified with `[RESOLVED]` in the title.
- The operator restricts the configuration to its own namespace; other namespaces are unaffected.

Each notification shows the summary, description, service, namespace, pod, container, severity,
start time (UTC) and, once resolved, end time, with links to the pod logs, a pod log search, the
runbook and the namespace's alerts in the console.

Log-based alerts are counts, so they cannot carry the log line itself: put what happened and
`{{ $value }}` in the description, and use the log links for the details.

## Writing rules

Add `rules/<service>.yaml` as a Template whose objects set `namespace: ${NAMESPACE}`. Only
`AlertingRule` (Loki), `PrometheusRule` and `AlertmanagerConfig` objects are accepted, and only in
the environment's namespace.

Labels and annotations used by routing and notifications:

| Kind       | Name                        | Value                                                        |
| ---------- | --------------------------- | ------------------------------------------------------------ |
| label      | `severity`                  | `critical`, `error`, `warning` or `info`                     |
| label      | `service`                   | Service name matching the rules file, e.g. `form-service`    |
| label      | `namespace`                 | `${NAMESPACE}`, set on every rule                            |
| label      | `kubernetes_pod_name`       | Keep in the query's `sum by (...)` so links point at the pod |
| label      | `kubernetes_container_name` | Keep in the query's `sum by (...)`                           |
| annotation | `summary`                   | One line naming the problem                                  |
| annotation | `description`               | What happened, including `{{ $value }}`                      |
| annotation | `runbook_url`               | Runbook for this alert; see [Runbooks](#runbooks)            |

Never put raw log messages or other unbounded values in labels.

## Runbooks

Every alert should set `runbook_url` to a page explaining what the alert means, how to confirm
impact and how to mitigate it. Alerts without one link here.

## Slack webhooks

Each environment's channel (`#adsp-alerts-dev`, `#adsp-alerts-uat`, `#adsp-alerts-prod`) has its own
Slack incoming webhook; the webhook, not the `channel` field, decides where messages go. Store the
URL as the `SLACK_WEBHOOK_URL` secret of the GitHub Environment `Dev`, `Staging` or `Production`.
CI writes it to Secret `adsp-alerts-slack` (key `webhook-url`) before applying the configuration.
Never commit webhook URLs.

If that Secret is missing the operator drops the whole AlertmanagerConfig, email included, so CI
fails rather than applying without it.

## Deployment

The **Monitoring configuration** workflow (`.github/workflows/monitoring.yml`):

1. On pull requests, renders every environment without deploying.
2. On merge to `main`, applies changed environments: dev, then uat after `Staging-gate` approval.
3. Prod is applied only by running the workflow manually on `main` and selecting `prod`.
   A manual run also re-applies dev or uat.

Each run renders, performs a server-side dry-run, updates the Slack Secret, then applies. Changes
to this README alone do not deploy.

Render locally with `.openshift/monitoring/render.sh dev` (requires `oc` and `jq`).

## Verification and rollback

A successful apply does not prove delivery. After the first deployment to an environment:

1. `oc get alertmanagerconfig -n adsp-<env>` lists `alertmanager-adsp-<env>`.
2. Trigger a rule from a short-lived test pod and confirm the email and Slack message arrive with
   working links, then a `[RESOLVED]` notification once it clears.
3. If nothing arrives, check that user workload monitoring routes to its Alertmanager and that the
   alert carries the `namespace` label; alerts without it are not matched.

Roll back with a reviewed revert merged to `main`. Removing a file does not delete its cluster
resource; delete that resource explicitly.
