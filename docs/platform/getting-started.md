---
layout: page
title: Getting started
nav_order: 1
parent: Platform development
---

# Getting started

## Project structure

ADSP repository is a monorepo using [Nx](https://github.com/nrwl/nx).

```
adsp-monorepo
├── .compose
├── .openshift
└── apps
    ├── api-docs-app
    └── ...
├── docs
└── libs
    ├── adsp-service-sdk
    └── core-common
└── tests
└── tools
```

Specific deployable frontend applications and backend services can be found under the `apps` folder and libraries of common modules can be found under the `libs` folder. The `.compose` and `.openshift` folders contain deployment manifests for docker compose and OpenShift. The `tests` folder contains artillery load test scenarios, the `tools` folder contains workspace templates, and the `docs` folder contains GitHub Pages content including this guide.

## Building sub-projects
The monorepo uses a common `package.json` across all sub-projects. Start by installing the dependencies including development dependencies.

```bash
npm i -D
```

Build (or run other targets) against specific sub-projects using:
```bash
npx nx build api-docs-app
npx nx test api-docs-app --code-coverage
```

Build sub-projects affected by current changes using the `nx affected` commands like:
```bash
npx nx affected --target build
```

## Configuring local environment
Backend services make use of the `dotenv` library and local environment can be configured by creating a `.env` file under the sub-project root folder.

Frontend applications retrieve configuration as a json document from the server. Locally this can be handled via the webpack development server proxy configuration. Refer to the `proxy.conf.json` file under the sub-project.

## Running in Docker compose
Manifests for running the services in docker compose can be found under the `.compose` folder. They are split across multiple files so that a subset of services can be run.

The backend services use a common base docker container image that includes npm dependencies to streamline local workflow. Build the base service in `.compose/docker-compose.infra.yml` to create this base image.

```base
docker-compose build base -f .compose/docker-compose.infra.yml
```

Run a set of components using:
```bash
docker-compose up -f .compose/docker-compose.infra.yml -f .compose/docker-compose.value.yml -f .compose/docker-compose.event.yml
```
