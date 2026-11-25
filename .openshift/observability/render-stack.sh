#!/usr/bin/env bash
# Renders observability-stack.yml for one environment into a List on stdout, with the parameters
# .github/workflows/observability.yml deploys it with. Refuses objects outside adsp-build (the
# ImageStreams) or the environment's namespace.
# Usage: render-stack.sh <dev|uat|prod>
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
params="$directory/../environments/$environment/observability-stack.env"
namespace="adsp-$environment"

# IMAGE_TAG is per environment: the ImageStreams in adsp-build are shared, so a shared tag would
# roll every environment's Deployments when one environment is deployed.
rendered=$(oc process --local -o json -f "$directory/observability-stack.yml" \
  --param-file "$params" \
  -p ENVIRONMENT_NAME="$environment" \
  -p NAMESPACE="$namespace" \
  -p INFRA_NAMESPACE=adsp-build \
  -p IMAGE_TAG="$environment")

jq --arg namespace "$namespace" '
  [.items[] | select(if .kind == "ImageStream" then .metadata.namespace != "adsp-build"
    else (.metadata.namespace // $namespace) != $namespace end)
    | "\(.kind)/\(.metadata.name) in \(.metadata.namespace)"]
  | if length > 0 then error("Unexpected objects: \(join(", "))") else empty end
' <<< "$rendered"

# A Grafana with OAuth enabled but no URLs redirects logins to localhost.
jq '
  [.items[] | select(.kind == "Deployment" and .metadata.name == "grafana")
    | .spec.template.spec.containers[0].env[] | select(.value != null) | {(.name): .value}] | add
  | if .GF_AUTH_GENERIC_OAUTH_ENABLED == "true" then
      [("GF_SERVER_ROOT_URL", "GF_AUTH_GENERIC_OAUTH_AUTH_URL", "GF_AUTH_GENERIC_OAUTH_TOKEN_URL",
        "GF_AUTH_GENERIC_OAUTH_API_URL") as $key | select((.[$key] // "") | test("^https://") | not) | $key]
      | if length > 0 then error("OAuth is enabled but not https: \(join(", "))") else empty end
    else empty end
' <<< "$rendered"

echo "$rendered"
