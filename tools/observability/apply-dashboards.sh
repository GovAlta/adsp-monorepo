#!/usr/bin/env bash
# Create or update the Grafana dashboard ConfigMap from the JSON files in the repo.
#
# The dashboards are ~100KB of JSON, so they are not inlined in observability-stack.yml. This builds the
# ConfigMap that observability-stack.yml's Grafana deployment mounts at /etc/grafana/dashboards, where the
# provisioning provider picks them up.
#
# Usage: tools/observability/apply-dashboards.sh <namespace> [configmap-name]
set -euo pipefail

NAMESPACE="${1:-}"
NAME="${2:-grafana-dashboards}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.openshift/observability/dashboards" && pwd)"

if [ -z "$NAMESPACE" ]; then
  echo "usage: $(basename "$0") <namespace> [configmap-name]" >&2
  exit 1
fi

shopt -s nullglob
files=("$DIR"/*.json)
if [ ${#files[@]} -eq 0 ]; then
  echo "no dashboard JSON found in $DIR" >&2
  exit 1
fi

# Fail loudly rather than shipping a dashboard Grafana will reject, and enforce the repo
# conventions documented in .openshift/observability/README.md.
for f in "${files[@]}"; do
  python3 - "$f" <<'PY'
import json, sys, pathlib
path = pathlib.Path(sys.argv[1])
try:
    d = json.loads(path.read_text())
except Exception as err:
    sys.exit(f"{path.name}: invalid JSON -- {err}")
if not d.get('uid'):
    sys.exit(f"{path.name}: no uid")
if path.stem != d['uid']:
    sys.exit(f"{path.name}: filename does not match uid '{d['uid']}'")
if d.get('id') is not None:
    sys.exit(f"{path.name}: id must be null (it is {d['id']!r}); run normalize-dashboard.mjs")
if 'version' in d:
    sys.exit(f"{path.name}: remove the version key; run normalize-dashboard.mjs")
PY
done

echo "applying ${#files[@]} dashboards to ${NAMESPACE}/${NAME}:"
for f in "${files[@]}"; do echo "  $(basename "$f")"; done

args=()
for f in "${files[@]}"; do args+=("--from-file=$(basename "$f")=$f"); done

oc create configmap "$NAME" "${args[@]}" \
  --dry-run=client -o yaml \
  | oc label -f - --local -o yaml \
      app=grafana component=observability \
  | oc apply -n "$NAMESPACE" -f -
