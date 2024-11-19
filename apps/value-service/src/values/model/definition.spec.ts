import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { ServiceUserRoles } from '../types';
import { ValueDefinitionEntity } from './definition';
import { NamespaceEntity } from './namespace';

describe('ValueDefinitionEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const validationServiceMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  const repositoryMock = {
    readValues: jest.fn(),
    countValues: jest.fn(),
    writeValues: jest.fn(),
    readMetrics: jest.fn(),
    readMetric: jest.fn(),
    writeMetric: jest.fn(),
  };

  const namespace = new NamespaceEntity(
    validationServiceMock,
    repositoryMock,
    {
      name: 'test-service',
      description: null,
      definitions: {},
    },
    tenantId
  );

  beforeEach(() => {
    validationServiceMock.validate.mockReset();
    repositoryMock.readValues.mockReset();
    repositoryMock.writeValues.mockReset();
  });

  it('can create entity', () => {
    const entity = new ValueDefinitionEntity(namespace, {
      name: 'test-value',
      description: null,
      type: null,
      jsonSchema: {},
    });
    expect(entity).toBeTruthy();
  });

  describe('getSchemaKey', () => {
    it('can get schema key', () => {
      const entity = new ValueDefinitionEntity(namespace, {
        name: 'test-value',
        description: null,
        type: null,
        jsonSchema: {},
      });

      const result = entity.getSchemaKey();
      expect(result).toBe('test-service:test-value');
    });
  });

  describe('readValues', () => {
    it('can read values', async () => {
      const entity = new ValueDefinitionEntity(namespace, {
        name: 'test-value',
        description: null,
        type: null,
        jsonSchema: {},
      });

      const page = {};
      repositoryMock.readValues.mockResolvedValueOnce({ results: [], page });
      const results = await entity.readValues(
        { tenantId, id: 'tester', roles: [ServiceUserRoles.Reader] } as User,
        tenantId,
        10
      );
      expect(results).toMatchObject({ page });
    });

    it('can throw for unauthorized user', () => {
      const entity = new ValueDefinitionEntity(namespace, {
        name: 'test-value',
        description: null,
        type: null,
        jsonSchema: {},
      });

      const page = {};
      repositoryMock.readValues.mockResolvedValueOnce({ results: [], page });
      expect(() => entity.readValues({ tenantId, id: 'tester', roles: [] } as User, tenantId, 10)).toThrowError(
        UnauthorizedUserError
      );
    });
  });

  describe('prepareValue', () => {
    it('can prepare write value', async () => {
      const entity = new ValueDefinitionEntity(namespace, {
        name: 'test-value',
        description: null,
        type: null,
        jsonSchema: {},
      });

      const write = {
        timestamp: new Date(),
        correlationId: null,
        context: {},
        value: {},
      };
      const prepared = entity.prepareWrite(tenantId, write);
      expect(prepared).toMatchObject(write);
      expect(validationServiceMock.validate).toHaveBeenCalledWith(
        "value 'test-service:test-value'",
        'test-service:test-value',
        write.value
      );
    });

    it('can prepare write value metrics', async () => {
      const entity = new ValueDefinitionEntity(namespace, {
        name: 'test-value',
        description: null,
        type: null,
        jsonSchema: {},
      });

      const write = {
        timestamp: new Date(),
        correlationId: null,
        context: {},
        value: { metrics: { b: 321 } },
        metrics: {
          a: 123,
        },
      };
      const prepared = entity.prepareWrite(tenantId, write);
      expect(prepared.metrics).toEqual(expect.objectContaining({ a: 123, b: 321 }));
    });
  });
});
