#!/usr/bin/env bash
# Renders rules/*.yaml then alertmanager-config.yaml for one environment into a single List on
# stdout, and refuses objects of an unexpected kind or outside that environment's namespace.
# Usage: render.sh <dev|uat|prod>
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

jq '{apiVersion: "v1", kind: "List", items: .}' <<< "$items"
