import { adspId } from '@abgov/adsp-service-sdk';
import { NamespaceEntity } from './namespace';

describe('NamespaceEntity', () => {
  const serviceMock = {
    isConnected: jest.fn(() => true),
    send: jest.fn(),
  };

  const validationMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  beforeEach(() => {
    serviceMock.send.mockReset();
    validationMock.validate.mockReset();
  });

  it('can be created', () => {
    const entity = new NamespaceEntity(validationMock, {
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
});
