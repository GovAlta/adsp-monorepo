import { adspId } from '@abgov/adsp-service-sdk';
import { EventServiceRoles } from '../role';
import { EventDefinitionEntity } from './definition';
import { NamespaceEntity } from './namespace';

describe('EventDescriptionEntity', () => {
  const serviceMock = {
    isConnected: jest.fn(() => true),
    send: jest.fn(),
  };

  const validationMock = {
    validate: jest.fn(),
  };

  beforeEach(() => {
    serviceMock.send.mockReset();
    validationMock.validate.mockReset();
  });

  it('can be created', () => {
    const entity = new EventDefinitionEntity(
      new NamespaceEntity({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
        name: 'test',
        definitions: {},
      }),
      {
        name: 'test',
        description: '',
        payloadSchema: {},
      }
    );

    expect(entity).toBeTruthy();
  });

  it('can indicate user with role can send', () => {
    const entity = new EventDefinitionEntity(
      new NamespaceEntity({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
        name: 'test',
        definitions: {},
      }),
      {
        name: 'test',
        description: '',
        payloadSchema: {},
      }
    );

    expect(
      entity.canSend({
        id: '1',
        name: 'core-user',
        email: '',
        isCore: true,
        roles: [EventServiceRoles.sender],
        token: { azp: null, aud: null, bearer: null, iss: null },
      })
    ).toBeTruthy();
  });

  it('can indicate user without role cannot send', () => {
    const entity = new EventDefinitionEntity(
      new NamespaceEntity({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
        name: 'test',
        definitions: {},
      }),
      {
        name: 'test',
        description: '',
        payloadSchema: {},
      }
    );

    expect(
      entity.canSend({
        id: '1',
        name: 'core-user',
        email: '',
        isCore: true,
        roles: [],
        token: { azp: null, aud: null, bearer: null, iss: null },
      })
    ).toBeFalsy();
  });

  it('can send event', () => {
    const entity = new EventDefinitionEntity(
      new NamespaceEntity({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
        name: 'test',
        definitions: {},
      }),
      {
        name: 'test',
        description: '',
        payloadSchema: {},
      }
    );

    validationMock.validate.mockReturnValueOnce(true);

    entity.send(
      serviceMock,
      validationMock,
      {
        id: '1',
        name: 'core-user',
        email: '',
        isCore: true,
        roles: [EventServiceRoles.sender],
        token: { azp: null, aud: null, bearer: null, iss: null },
      },
      {
        namespace: 'test',
        name: 'test',
        timestamp: new Date(),
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
        payload: {},
      }
    );

    expect(serviceMock.send).toHaveBeenCalledTimes(1);
  });
});
