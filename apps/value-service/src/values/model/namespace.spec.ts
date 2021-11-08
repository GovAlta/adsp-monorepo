import { adspId } from '@abgov/adsp-service-sdk';
import { NamespaceEntity } from './namespace';

describe('NamespaceEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const validationServiceMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  const repositoryMock = {
    readValues: jest.fn(),
    writeValue: jest.fn(),
    readMetric: jest.fn(),
    writeMetric: jest.fn(),
  };

  it('can create entity', () => {
    const entity = new NamespaceEntity(
      validationServiceMock,
      repositoryMock,
      {
        name: 'test-service',
        description: null,
        definitions: { 'test-value': { name: 'test-value', description: null, type: null, jsonSchema: {} } },
      },
      tenantId
    );
    expect(entity).toBeTruthy();
  });
});
