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
      id: BUILDER_PREVIEW_CLIENT_ID,
      name: 'Builder preview',
      description: 'Used by the preview of an application in the builder app to make platform API requests.',
      redirectUris: [`${origin}/token-handler/clients/${BUILDER_PREVIEW_CLIENT_ID}/callback`],
      // The preview signs in with a separate window, which this page closes.
      successRedirectUrl: '/preview-sign-in-complete.html',
      failureRedirectUrl: '/preview-sign-in-complete.html',
      // The services are the upstreams, so the preview's requests use the same paths as for the services directly.
      targets: {
        'form-service': { id: 'form-service', upstream: adspId`urn:ads:platform:form-service`.toString() },
        'file-service': { id: 'file-service', upstream: adspId`urn:ads:platform:file-service`.toString() },
      },
    },
  };
}
