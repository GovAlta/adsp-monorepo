import Ajv from 'ajv';

import { configurationSchema } from './token/configuration';
import { BUILDER_PREVIEW_CLIENT_ID, createBuilderPreviewClient } from './builder';

describe('createBuilderPreviewClient', () => {
  it('can create the client with a redirect URI on the builder origin', () => {
    const clients = createBuilderPreviewClient('https://builder.example.ca/some/path');
    const client = clients[BUILDER_PREVIEW_CLIENT_ID];

    expect(client.successRedirectUrl).toBe('/preview-sign-in-complete.html');
    expect(client.redirectUris).toEqual(['https://builder.example.ca/token-handler/clients/builder-preview/callback']);
    expect(Object.keys(client.targets)).toEqual(['form-service', 'file-service']);
    expect(client.targets['form-service'].upstream).toBe('urn:ads:platform:form-service');
  });

  it('can keep the port of the builder origin', () => {
    const client = createBuilderPreviewClient('http://localhost:4200/')[BUILDER_PREVIEW_CLIENT_ID];
    expect(client.redirectUris).toEqual(['http://localhost:4200/token-handler/clients/builder-preview/callback']);
  });

  it('can create a client that is valid for the configuration schema', () => {
    const validate = new Ajv({ strict: false }).compile(configurationSchema);
    const clients = createBuilderPreviewClient('https://builder.example.ca');

    expect(validate({ clients })).toBe(true);
    // Mutation guard: the schema requires an ID, so a client without one must be rejected.
    const { id: _id, ...withoutId } = clients[BUILDER_PREVIEW_CLIENT_ID];
    expect(validate({ clients: { [BUILDER_PREVIEW_CLIENT_ID]: withoutId } })).toBe(false);
  });
});
