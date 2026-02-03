// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

export const environment = {
  production: false,
  access: {
    url: 'https://access.adsp-dev.gov.ab.ca',
    realm: '51e22cc3-265a-43c2-ad8a-6ff445d85218',
    client_id: 'urn:ads:demo:chat-app',
  },
  directory: {
    url: 'https://directory-service.adsp-dev.gov.ab.ca'
  }
};
