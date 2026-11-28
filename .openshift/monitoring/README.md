# ADSP alerting

Alert rules and notification routing for the `adsp-dev`, `adsp-uat` and `adsp-prod` namespaces.
Alerts are delivered by email to the addresses in `EMAIL_TO` of `params/<env>.env` and to the
Slack channel of each environment.

```
.openshift/monitoring/
├── rules/<service>.yaml        # Alert rules, one OpenShift Template per service
├── alertmanager-config.yaml    # AlertmanagerConfig alertmanager-<namespace> (email + Slack)
├── params/<env>.env            # Parameters shared by every template, per environment
└── render-manifests.sh         # Renders one environment; used by CI and locally
```

Every file is an OpenShift Template processed with `params/<env>.env`, so the same rule or
receiver ships to every environment and only parameters differ. Templates ignore parameters they
do not declare, so per-service thresholds (for example `FORM_SERVICE_RESTART_THRESHOLD=3`) live in
the same params files. Param files treat `#` as a comment: values must not contain it, which is why
`SLACK_CHANNEL` omits the leading `#`.

## Routing

| Severity         | First notification | Repeat while firing |
| ---------------- | ------------------ | ------------------- |
| `critical`       | immediately        | 30m                 |
| `warning`        | after 1m           | 2h                  |
| other or missing | after 30s          | 4h                  |
| `info`           | not notified       | -                   |

- Alerts are grouped by `alertname` and `service`, so pods of one service firing together arrive as
  one notification that lists each pod.
- A firing `critical` alert suppresses `warning` alerts for the same service and pod.
- Resolved alerts are notified with `[RESOLVED]` in the title.
- The operator restricts the configuration to its own namespace; other namespaces are unaffected.

Notifications are written for whoever is on call, possibly in the middle of the night. A firing
alert shows, in order:

1. **What's happening**: the `description`.
2. **Impact**: who or what is affected (`impact`).
3. **First steps**: the first checks to make (`first_steps`).
4. **Runbook**: a link to this alert's own runbook (`runbook_url`).
5. Service, namespace, pod, container, severity and start time (UTC), each on its own line in both
   email and Slack, with links to the pod logs, a pod log search and the namespace's alerts in the
   console.

A resolved alert shows the same details with its end time instead of the impact and first steps.

Log-based alerts are counts, so they cannot carry the log line itself: put what happened and
`{{ $value }}` in the description, and use the log links for the details.

## Writing rules

Add `rules/<service>.yaml` as a Template whose objects set `namespace: ${NAMESPACE}`. Only
`AlertingRule` (Loki), `PrometheusRule` and `AlertmanagerConfig` objects are accepted, and only in
the environment's namespace. Loki `AlertingRule` objects must carry the label
`loki.grafana.com/rules: 'true'`: LokiStack silently ignores rules without it, so
`render-manifests.sh` rejects them.

Labels and annotations used by routing and notifications. `render-manifests.sh` rejects an alert
missing any of the required ones, so CI fails on the pull request.

| Kind       | Name                        | Required | Value                                                           |
| ---------- | --------------------------- | -------- | --------------------------------------------------------------- |
| label      | `severity`                  | yes      | `critical`, `warning` or `info` (the values Loki accepts)       |
| label      | `service`                   | yes      | Service name matching the rules file, e.g. `form-service`       |
| label      | `namespace`                 |          | `${NAMESPACE}`, set on every rule                               |
| label      | `kubernetes_pod_name`       |          | Keep in the query's `sum by (...)` so links point at the pod    |
| label      | `kubernetes_container_name` |          | Keep in the query's `sum by (...)`                              |
| annotation | `summary`                   | yes      | One line naming the problem                                     |
| annotation | `description`               | yes      | What happened, including `{{ $value }}`                         |
| annotation | `impact`                    | yes      | Who or what is affected, in plain words                         |
| annotation | `first_steps`               | yes      | Numbered first checks, one per line                             |
| annotation | `runbook_url`               | yes      | `https` link to this alert's runbook; see [Runbooks](#runbooks) |

Example:

```yaml
- alert: FormServiceErrorLogs
  expr: ...
  labels:
    severity: critical
    service: form-service
    namespace: ${NAMESPACE}
  annotations:
    summary: form-service is logging errors
    description: 'form-service logged {{ $value }} errors in the last 5 minutes.'
    impact: Users may be unable to submit forms or save drafts.
    first_steps: |
      1. Open the pod logs and read the first error after the start time.
      2. Check whether form-service restarted or was deployed in the last hour.
      3. If submissions are failing, follow Mitigate in the runbook.
    runbook_url: https://goa-dio.atlassian.net/wiki/spaces/ADSPA/pages/<id>
```

Never put raw log messages or other unbounded values in labels.

## Runbooks

Runbooks live in Confluence under
[ADSPA / Runbook](https://goa-dio.atlassian.net/wiki/spaces/ADSPA/folder/5203099686/Runbook),
one page per alert, named `<AlertName> - <service>`. Copy the
[Runbook template](https://goa-dio.atlassian.net/wiki/spaces/ADSPA/pages/5227315672), write the page
before the rule is merged, and set the rule's `runbook_url` to it. Each page covers:

- **Meaning**: what the alert detects and why it matters.
- **Impact**: who or what is affected, and how badly.
- **Diagnose**: numbered checks, with the console pages or commands to use.
- **Mitigate**: the fix for each likely cause, including rollback.
- **Escalate**: when and to whom, if it is not mitigated in time.
- **Known false positives**: and how to tell them apart.
- **Owner** and date last reviewed.

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

Render locally with `.openshift/monitoring/render-manifests.sh dev` (requires `oc` and `jq`).

## Verification and rollback

A successful apply does not prove delivery. After the first deployment to an environment:

1. `oc get alertmanagerconfig -n adsp-<env>` lists `alertmanager-adsp-<env>`.
2. Trigger a rule from a short-lived test pod and confirm the email and Slack message arrive with
   working links, then a `[RESOLVED]` notification once it clears.
3. If nothing arrives, check that the Loki ruler loaded the rule (its `AlertingRule` has the
   `loki.grafana.com/rules` label), that user workload monitoring routes to its Alertmanager and
   that the alert carries the `namespace` label; alerts without it are not matched.

Roll back with a reviewed revert merged to `main`. Removing a file does not delete its cluster
resource; delete that resource explicitly.
