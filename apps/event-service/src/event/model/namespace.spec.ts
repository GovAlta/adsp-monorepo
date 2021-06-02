import { adspId } from '@abgov/adsp-service-sdk';
import { NamespaceEntity } from './namespace';

describe('NamespaceEntity', () => {
  it('can be created', () => {
    const entity = new NamespaceEntity({
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      definitions: {
        test: {
          name: 'test',
          description: '',
          payloadSchema: {},
        },
      },
    });

    expect(entity).toBeTruthy();
    expect(entity.definitions['test']).toBeTruthy();
  });

  it('can indicate null user cannot send', () => {
    const entity = new NamespaceEntity({
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      definitions: {
        test: {
          name: 'test',
          description: '',
          payloadSchema: {},
        },
      },
    });

    expect(entity.canSend(null)).toBeFalsy();
  });

  it('can indicate core user can send for tenant', () => {
    const entity = new NamespaceEntity({
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      definitions: {
        test: {
          name: 'test',
          description: '',
          payloadSchema: {},
        },
      },
    });

    expect(
      entity.canSend({
        id: '1',
        name: 'core-user',
        email: '',
        isCore: true,
        roles: [],
        token: { azp: null, aud: null, bearer: null, iss: null },
      })
    ).toBeTruthy();
  });

  it('can indicate tenant user can send', () => {
    const entity = new NamespaceEntity({
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      definitions: {
        test: {
          name: 'test',
          description: '',
          payloadSchema: {},
        },
      },
    });

    expect(
      entity.canSend({
        id: '1',
        name: 'tenant-user',
        email: '',
        isCore: false,
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
        roles: [],
        token: { azp: null, aud: null, bearer: null, iss: null },
      })
    ).toBeTruthy();
  });

  it('can indicate tenant user cannot send for different tenant', () => {
    const entity = new NamespaceEntity({
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      definitions: {
        test: {
          name: 'test',
          description: '',
          payloadSchema: {},
        },
      },
    });

    expect(
      entity.canSend({
        id: '1',
        name: 'tenant-user',
        email: '',
        isCore: false,
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        roles: [],
        token: { azp: null, aud: null, bearer: null, iss: null },
      })
    ).toBeFalsy();
  });
});
