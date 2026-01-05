## Run the load test locally

For convenience, a client named as <b>artillery-cli</b> has been created in autotest tenant in DEV and UAT. The client proivdes the permissions for the load test:

```shell
# Set up the local credential environment variables:
set ARTILLERY_CLIENT_SECRET=<Client Secret>

# Command line to run the load test locally:
./node_modules/artillery/bin/run run tests/<service-name>/load.yml --environment <environment>

# The <environment> can be either dev or uat. Please add appropriate artillery options based on task to complete your load test.
```

## Run the load test in CI/CD pipeline

Run the <b>Artillery performance tests</b> action in the repository.
