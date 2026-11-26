#!/usr/bin/env bash
# Renders rules/*.yaml then alertmanager-config.yaml for one environment into a single List on
# stdout. Refuses objects of an unexpected kind or outside that environment's namespace, and
# alerts missing the labels and annotations that make them actionable.
# Usage: render-manifests.sh <dev|uat|prod>
set -euo pipefail

environment=${1:-}
case "$environment" in
  dev | uat | prod) ;;
  *)
    echo "Usage: $0 <dev|uat|prod>" >&2
    exit 2
    ;;
esac

directory=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
params="$directory/params/$environment.env"
namespace="adsp-$environment"

grep -qx "NAMESPACE=$namespace" "$params" || {
  echo "$params must set NAMESPACE=$namespace" >&2
  exit 1
}

shopt -s nullglob
templates=("$directory"/rules/*.yaml "$directory/alertmanager-config.yaml")

items='[]'
for template in "${templates[@]}"; do
  rendered=$(oc process --local -f "$template" --param-file "$params" --ignore-unknown-parameters -o json) || {
    echo "Failed to render $template" >&2
    exit 1
  }
  items=$(jq -c --argjson accumulated "$items" '$accumulated + .items' <<< "$rendered")
done

jq --arg namespace "$namespace" '
  [.[] | select((.kind | IN("AlertmanagerConfig", "AlertingRule", "PrometheusRule") | not)
    or .metadata.namespace != $namespace) | "\(.kind)/\(.metadata.name) in \(.metadata.namespace // "no namespace")"]
  | if length > 0 then error("Unexpected objects: \(join(", "))") else empty end
' <<< "$items"

# LokiStack silently ignores AlertingRules without this label, so their alerts would never fire.
jq '
  [.[] | select(.kind == "AlertingRule" and .metadata.labels["loki.grafana.com/rules"] != "true")
    | "\(.kind)/\(.metadata.name)"]
  | if length > 0 then error("Missing label loki.grafana.com/rules=true: \(join(", "))") else empty end
' <<< "$items"

# Every alert must be actionable: see "Writing rules" in README.md.
jq -r '
  [.[] | select(.kind | IN("AlertingRule", "PrometheusRule")) | .kind as $kind | .metadata.name as $name
    | .spec.groups[]?.rules[]? | select(.alert) | . as $rule
    | ([if (.labels.severity // "") | IN("critical", "warning", "info") | not then "severity must be critical, warning or info" else empty end]
      + [if (.labels.service // "") == "" then "missing label service" else empty end]
      + [("summary", "description", "impact", "first_steps") as $key
          | if (.annotations[$key] // "" | gsub("\\s"; "")) == "" then "missing annotation \($key)" else empty end]
      + [if (.annotations.runbook_url // "") | test("^https://") | not then "runbook_url must be an https link to the alert runbook" else empty end])
    | select(length > 0) | "\($kind)/\($name) alert \($rule.alert): \(join("; "))"]
  | if length > 0 then error("Alerts are not actionable:\n\(join("\n"))") else empty end
' <<< "$items"

jq '{apiVersion: "v1", kind: "List", items: .}' <<< "$items"
