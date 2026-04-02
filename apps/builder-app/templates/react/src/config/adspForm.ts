export type AdspFormMode = 'mock' | 'live';

export interface AdspFormStarterConfig {
  mode: AdspFormMode;
  serviceName: string;
  serviceDescription: string;
  definitionId: string;
  formServiceBaseUrl: string;
  accessToken?: string;
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
