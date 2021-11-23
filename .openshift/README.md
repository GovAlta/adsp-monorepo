## Description

.openshift folder contains configurations or templates used to build the openshift infrastucture. The templates under the managed folder will be automacially applied to the specific environment in CI/CD. Ideally, the managed templates are created using the nx-tools.

## OpenShift Infrastructure Description

Currently, the templates create 4 OpenShift projects on the GoA OpenShift cluster:

- core-services-infra: image repositories and build configurations used by the CI/CD.
- core-services-dev: DEV environment deployment configurations and services (route and DNS).
- core-services-test: TEST environment deployment configurations and services (route and DNS).
- core-services-uat: UAT environment deployment configurations and services (route and DNS).

## Template Envrionment Selection

For convenience, the infrastructure of a given application in description within one template. For example, the infrastructure of status-app application is determined by template ./managed/status-app.yml. The OpenShift label selector is used to inform us the relation between project and definitions in the template.

```
metadata:
  labels:
    app: ${APP_NAME}${NAME_SUFFIX}
    component: app
    apply-infra: 'true' # The configurations are included in the infra project
    apply-dev: 'true' # The configurations are included in the DEV environment
    apply-test: 'true' # The configurations are included in the TEST environment
	apply-staging:  'true' # The configurations are included in the UAT environment
	apply-prod:  'true' # The configurations are included in the PROD environment
```

The commands for the label selection are listed here:

```
# Pass parameter to the template
oc process -f ./openshift/managed/<application_name>.yml -p NAMESPACE=core-services-dev -p INFRA_NAMESPACE=core-services-infra > deploy-manifest.json

# Create resouces for Infra
oc project core-services-infra
oc apply -f deploy-manifest.json -l apply-infra=true

# Create resouces for DEV
oc project core-services-dev
oc apply -f deploy-manifest.json -l apply-dev=true

# Create resouces for TEST
oc project core-services-test
oc apply -f deploy-manifest.json -l apply-test=true
```

## NOTE

- Due to the CI/CD migration, we need to manually apply the managed templates manually.
