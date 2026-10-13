import { type TokenHandlerConfig } from '../lib/tokenHandler';

export type AdspFormMode = 'mock' | 'live';

export interface AdspFormStarterConfig {
  mode: AdspFormMode;
  serviceName: string;
  serviceDescription: string;
  definitionId: string;
  formServiceBaseUrl: string;
  accessToken?: string;
  // Use the token handler for live requests instead of an access token: set formServiceBaseUrl to
  // '/token-handler/targets/form-service'. Users sign in with the 'Sign in' button when a request needs it.
  tokenHandler?: TokenHandlerConfig;
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
