---
layout: page
title: Getting started
parent: Platform development
---

# Getting started

## Project structure

ADSP repository is a monorepo using [Nx](https://github.com/nrwl/nx).

```
adsp-monorepo
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

Specific deployable frontend applications and backend services can be found under the `apps` folder and libraries of common modules can be found under the `libs` folder. The `.openshift` folder contains OpenShift deployment manifests. The `tests` folder contains artillery load test scenarios, the `tools` folder contains workspace templates, and the `docs` folder contains GitHub Pages content including this guide.

## Building sub-projects
The monorepo uses a common `package.json` across all sub-projects. Start by installing the dependencies, including development dependencies, from the lock file.

```bash
npm ci
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
