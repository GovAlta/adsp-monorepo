// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

export const environment = {
  production: false,
  directory: {
    url: 'https://directory-service.adsp-dev.gov.ab.ca',
  },
  access: {
    url: 'https://access.adsp-dev.gov.ab.ca',
    realm: 'b6aff762-20f8-4c5d-88d3-c38ae16d1937',
    client_id: 'urn:ads:platform:project-planner-app',
  },
  serviceUrl: 'http://localhost:3381',
};
