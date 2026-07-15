// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

export const environment = {
  production: false,
  directory: {
    url: 'https://directory-service.adsp-dev.gov.ab.ca',
  },
  access: {
    url: 'https://access.adsp-dev.gov.ab.ca',
    client_id: 'urn:ads:platform:sandbox-app',
  },
  feedback: {
    url: 'https://feedback-service.adsp-uat.alberta.ca/feedback/v1/script/adspFeedback.js',
  },
  tenantName: 'autotest',
  recaptchaKey: '',
};
