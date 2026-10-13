export type AdspFormMode = 'mock' | 'live';

export interface AdspFormStarterConfig {
  mode: AdspFormMode;
  serviceName: string;
  serviceDescription: string;
  definitionId: string;
  formServiceBaseUrl: string;
  accessToken?: string;
  // Make live requests through the token handler, which signs the user in and adds their access token, instead of
  // using an access token: set formServiceBaseUrl to '/token-handler/targets/form-service'. Builder preview signs
  // the user in when the builder loads.
  tokenHandler?: boolean;
  submitOnCreate: boolean;
}

export const adspFormConfig: AdspFormStarterConfig = {
  // Use mock mode while prototyping in Builder preview.
  // Switch to live once you have a form definition and tenant endpoint.
  mode: 'mock',
  serviceName: 'Program application service',
  serviceDescription:
    'Use this starter to describe your government program and collect applications with an ADSP form.',
  definitionId: 'replace-with-form-definition-id',
  formServiceBaseUrl: 'https://your-tenant.example.adsp.gov.ab.ca',
  accessToken: '',
  submitOnCreate: true,
};
