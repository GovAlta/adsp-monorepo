import { adspId } from '@abgov/adsp-service-sdk';
import { EventDefinitionEntity } from './definition';
import { NamespaceEntity } from './namespace';

describe('EventDescriptionEntity', () => {
  const validationMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  beforeEach(() => {
    validationMock.validate.mockReset();
  });

  it('can be created', () => {
    const entity = new EventDefinitionEntity(
      new NamespaceEntity(validationMock, {
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

  it('can validate event', () => {
    const entity = new EventDefinitionEntity(
      new NamespaceEntity(validationMock, {
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

    entity.validate({
      namespace: 'test',
      name: 'test',
      timestamp: new Date(),
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      payload: {},
    });
  });
});
