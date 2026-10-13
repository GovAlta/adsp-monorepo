import { adspId } from '@abgov/adsp-service-sdk';

export const BUILDER_PREVIEW_CLIENT_ID = 'builder-preview';

/**
 * Core configuration for the client used by the preview in the builder app, which makes platform API requests for
 * the signed in user. The preview is served from the builder app's origin, so the redirect URI is on that origin.
 */
export function createBuilderPreviewClient(builderAppUrl: string) {
  const origin = new URL(builderAppUrl).origin;
  return {
    [BUILDER_PREVIEW_CLIENT_ID]: {
      name: 'Builder preview',
      description: 'Used by the preview of an application in the builder app to make platform API requests.',
      redirectUris: [`${origin}/token-handler/clients/${BUILDER_PREVIEW_CLIENT_ID}/callback`],
      successRedirectUrl: '/',
      failureRedirectUrl: '/',
      targets: {
        'form-service': { upstream: adspId`urn:ads:platform:form-service:v1`.toString() },
        'file-service': { upstream: adspId`urn:ads:platform:file-service:v1`.toString() },
      },
    },
  };
}
