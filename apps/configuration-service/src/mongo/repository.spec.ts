import { AdspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, ValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import {
  ConfigurationEntityCriteria,
  ConfigurationEntity,
  ConfigurationRevision,
  RevisionCriteria,
} from '../configuration';
import { MongoConfigurationRepository } from './repository';

jest.mock('mongoose', () => {
  const mModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    on: jest.fn(),
  };
  return {
    model: jest.fn(() => mModel),
    Schema: jest.fn(() => ({
      index: jest.fn(),
    })),
    SchemaTypes: {
      Mixed: 'Mixed',
    },
  };
});

describe('MongoConfigurationRepository', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const validationServiceMock = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  } as unknown as ValidationService;

  let repository: MongoConfigurationRepository;
  let revisionModelMock: {
    aggregate: jest.Mock;
    find: jest.Mock;
    deleteMany: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOne: jest.Mock;
  };
  let activeRevisionModelMock: { deleteOne: jest.Mock; findOne: jest.Mock; findOneAndUpdate: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MongoConfigurationRepository(loggerMock, validationServiceMock);
    // Access the private revisionModel to mock its methods
    revisionModelMock = (
      repository as unknown as {
        revisionModel: {
          aggregate: jest.Mock;
          find: jest.Mock;
          deleteMany: jest.Mock;
          findOneAndUpdate: jest.Mock;
          findOne: jest.Mock;
        };
      }
    ).revisionModel;
    activeRevisionModelMock = (
      repository as unknown as {
        activeRevisionModel: { deleteOne: jest.Mock; findOne: jest.Mock; findOneAndUpdate: jest.Mock };
      }
    ).activeRevisionModel;
  });

  describe('find', () => {
    it('can find with criteria', async () => {
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        ministry: 'test-ministry',
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria);

      expect(revisionModelMock.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              'configuration.ministry': { $regex: 'test-ministry', $options: 'i' },
            }),
          }),
        ])
      );
    });

    it('can find with OR criteria', async () => {
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        ministry: 'test-ministry',
        program: 'test-program',
        useOr: true,
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria);

      expect(revisionModelMock.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              $or: expect.arrayContaining([
                { 'configuration.ministry': { $regex: 'test-ministry', $options: 'i' } },
                { 'configuration.program': { $regex: 'test-program', $options: 'i' } },
              ]),
            },
          }),
        ])
      );
    });

    it('prevents Operator Injection (e.g. $where) in criteria keys', async () => {
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        $where: 'sleep(1000)',
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria);

      // Should not contain the injected key
      const calls = revisionModelMock.aggregate.mock.calls[0][0];
      const matchStage = calls.find(
        (stage: { $match: Record<string, unknown> }) => stage.$match && stage.$match['configuration.$where']
      );
      expect(matchStage).toBeUndefined();
    });

    it('prevents Object Injection (e.g. { $ne: null }) in criteria values', async () => {
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        password: { $ne: null },
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria as unknown as ConfigurationEntityCriteria);

      // Should not contain the injected object value
      const calls = revisionModelMock.aggregate.mock.calls[0][0];
      const matchStage = calls.find(
        (stage: { $match: Record<string, unknown> }) => stage.$match && stage.$match['configuration.password']
      );
      expect(matchStage).toBeUndefined();
    });

    it('prevents Regex Injection by escaping special characters', async () => {
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        name: '.*',
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria);

      expect(revisionModelMock.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              'configuration.name': { $regex: '\\.\\*', $options: 'i' },
            }),
          }),
        ])
      );
    });

    it('prevents Parameter Pollution by ignoring array values', async () => {
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        ministry: ['test', 'admin'], // Array value
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria as unknown as ConfigurationEntityCriteria);

      // Should not contain the array value key
      const calls = revisionModelMock.aggregate.mock.calls[0][0];
      const matchStage = calls.find(
        (stage: { $match: Record<string, unknown> }) => stage.$match && stage.$match['configuration.ministry']
      );
      expect(matchStage).toBeUndefined();
    });

    it('allows Deep Property Access via dot notation', async () => {
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        'metadata.author': 'me',
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria);

      expect(revisionModelMock.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              'configuration.metadata.author': { $regex: 'me', $options: 'i' },
            }),
          }),
        ])
      );
    });

    it('prevents Logical Scope Expansion when using OR criteria', async () => {
      // Verifies that tenant filter is applied independently of the OR conditions
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        ministry: 'test-ministry',
        useOr: true,
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria);

      const pipeline = revisionModelMock.aggregate.mock.calls[0][0];

      // First match should contain tenant
      const firstMatch = pipeline[0].$match;
      expect(firstMatch.tenant).toBeDefined();
      expect(firstMatch.tenant).not.toEqual({ $exists: false });

      // OR match should be later in pipeline
      const orMatch = pipeline.find((stage: { $match: { $or: unknown } }) => stage.$match && stage.$match.$or);
      expect(orMatch).toBeDefined();
    });

    it('handles Type Confusion by passing primitives directly', async () => {
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        count: 123,
        isActive: true,
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria as unknown as ConfigurationEntityCriteria);

      expect(revisionModelMock.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              'configuration.count': 123,
              'configuration.isActive': true,
            }),
          }),
        ])
      );
    });

    it('handles Long Strings safely (ReDoS mitigation check)', async () => {
      const longString = 'a'.repeat(10000) + '.*';
      const criteria = {
        tenantIdEquals: AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test'),
        namespaceEquals: 'test-namespace',
        description: longString,
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria);

      // Verify it was escaped and passed to regex
      const escaped = longString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(revisionModelMock.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              'configuration.description': { $regex: escaped, $options: 'i' },
            }),
          }),
        ])
      );
    });
  });

  describe('get', () => {
    it('can get configuration', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');

      const findMock = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation((cb) => cb(null, [{ configuration: {} }])),
      };
      revisionModelMock.find.mockReturnValue(findMock);

      const result = await repository.get(namespace, name, tenantId);

      expect(result).toBeTruthy();
      expect(revisionModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ namespace, name, tenant: tenantId.toString() }),
        null,
        expect.any(Object)
      );
    });
  });

  describe('delete', () => {
    it('can delete configuration', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');
      const entity = {
        namespace,
        name,
        tenantId,
      } as unknown as ConfigurationEntity<unknown>;

      revisionModelMock.deleteMany.mockResolvedValue({ deletedCount: 1 });
      activeRevisionModelMock.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await repository.delete(entity);

      expect(result).toBe(true);
      expect(revisionModelMock.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ namespace, name, tenant: tenantId.toString() })
      );
    });
  });

  describe('getRevisions', () => {
    it('can get revisions', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');
      const entity = {
        namespace,
        name,
        tenantId,
      } as unknown as ConfigurationEntity<unknown>;

      const findMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockImplementation((cb) =>
            cb(null, [{ revision: 1, configuration: {}, created: new Date(), lastUpdated: new Date() }])
          ),
      };
      revisionModelMock.find.mockReturnValue(findMock);

      const result = await repository.getRevisions(entity, 10, undefined, {});

      expect(result.results.length).toBe(1);
      expect(revisionModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ namespace, name, tenant: tenantId.toString() }),
        null,
        expect.any(Object)
      );
    });
  });

  describe('saveRevision', () => {
    it('can save revision', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');
      const entity = {
        namespace,
        name,
        tenantId,
      } as unknown as ConfigurationEntity<unknown>;
      const revision = {
        revision: 1,
        configuration: {},
      } as unknown as ConfigurationRevision<unknown>;

      const findOneAndUpdateMock = {
        exec: jest
          .fn()
          .mockImplementation((cb) =>
            cb(null, { revision: 1, configuration: {}, created: new Date(), lastUpdated: new Date() })
          ),
      };
      revisionModelMock.findOneAndUpdate.mockReturnValue(findOneAndUpdateMock);

      const result = await repository.saveRevision(entity, revision);

      expect(result).toBeTruthy();
      expect(revisionModelMock.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ namespace, name, revision: 1, tenant: tenantId.toString() }),
        expect.any(Object),
        expect.objectContaining({ upsert: true, new: true, lean: true })
      );
    });
  });

  describe('getActiveRevision', () => {
    it('can get active revision', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');

      const activeRevisionMock = {
        exec: jest.fn().mockResolvedValue({ active: 1 }),
      };
      activeRevisionModelMock.findOne.mockReturnValue(activeRevisionMock);

      const revisionMock = {
        exec: jest.fn().mockResolvedValue({ revision: 1, configuration: {} }),
      };
      revisionModelMock.findOne.mockReturnValue(revisionMock);

      const result = await repository.getActiveRevision(namespace, name, tenantId);

      expect(result).toBeTruthy();
      expect(result.revision).toBe(1);
    });

    it('returns null if no active revision', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');

      const activeRevisionMock = {
        exec: jest.fn().mockResolvedValue(null),
      };
      activeRevisionModelMock.findOne.mockReturnValue(activeRevisionMock);

      const result = await repository.getActiveRevision(namespace, name, tenantId);

      expect(result).toBeNull();
    });
  });

  describe('setActiveRevision', () => {
    it('can set active revision', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');
      const entity = {
        namespace,
        name,
        tenantId,
      } as unknown as ConfigurationEntity<unknown>;

      const revisionMock = {
        exec: jest.fn().mockResolvedValue({ revision: 1 }),
      };
      revisionModelMock.findOne.mockReturnValue(revisionMock);

      const activeRevisionMock = {
        exec: jest.fn().mockResolvedValue({ active: 1 }),
      };
      activeRevisionModelMock.findOneAndUpdate.mockReturnValue(activeRevisionMock);

      const result = await repository.setActiveRevision(entity, 1);

      expect(result).toBeTruthy();
      expect(result.revision).toBe(1);
    });

    it('throws error for invalid revision', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');
      const entity = {
        namespace,
        name,
        tenantId,
      } as unknown as ConfigurationEntity<unknown>;

      await expect(repository.setActiveRevision(entity, -1)).rejects.toThrow(InvalidOperationError);
    });

    it('throws error if revision not found', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const tenantId = AdspId.parse('urn:ads:platform:tenant-service:v2:/tenants/test');
      const entity = {
        namespace,
        name,
        tenantId,
      } as unknown as ConfigurationEntity<unknown>;

      const revisionMock = {
        exec: jest.fn().mockResolvedValue(null),
      };
      revisionModelMock.findOne.mockReturnValue(revisionMock);

      await expect(repository.setActiveRevision(entity, 1)).rejects.toThrow(InvalidOperationError);
    });
  });

  describe('constructor', () => {
    it('handles index error', () => {
      // Re-instantiate to trigger constructor logic with mocks
      const repo = new MongoConfigurationRepository(loggerMock, validationServiceMock);

      // Access the private revisionModel to get the 'on' mock
      const revisionModel = (repo as unknown as { revisionModel: { on: jest.Mock } }).revisionModel;
      const onCall = revisionModel.on.mock.calls[0];
      expect(onCall[0]).toBe('index');

      // Invoke the callback with an error
      const callback = onCall[1];
      const err = new Error('Index error');
      callback(err);

      expect(loggerMock.error).toHaveBeenCalledWith(`Error encountered ensuring index: ${err}`);
    });
  });

  describe('find (additional coverage)', () => {
    it('can find without tenantId', async () => {
      const criteria = {
        namespaceEquals: 'test-namespace',
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria);

      expect(revisionModelMock.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              tenant: { $exists: false },
            }),
          }),
        ])
      );
    });

    it('can find with registeredIdEquals', async () => {
      const criteria = {
        registeredIdEquals: 'test-registered-id',
      };

      const aggregateMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      revisionModelMock.aggregate.mockReturnValue(aggregateMock);

      await repository.find(criteria);

      expect(revisionModelMock.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              'configuration.registeredId': 'test-registered-id',
            }),
          }),
        ])
      );
    });
  });

  describe('get (additional coverage)', () => {
    it('can get configuration without tenantId', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';

      const findMock = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation((cb) => cb(null, [{ configuration: {} }])),
      };
      revisionModelMock.find.mockReturnValue(findMock);

      await repository.get(namespace, name);

      expect(revisionModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ namespace, name, tenant: { $exists: false } }),
        null,
        expect.any(Object)
      );
    });
  });

  describe('getRevisions (additional coverage)', () => {
    it('can get revisions without criteria', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const entity = {
        namespace,
        name,
      } as unknown as ConfigurationEntity<unknown>;

      const findMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation((cb) => cb(null, [])),
      };
      revisionModelMock.find.mockReturnValue(findMock);

      await repository.getRevisions(entity, 10, undefined, null);

      expect(revisionModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ namespace, name }),
        null,
        expect.any(Object)
      );
    });

    it('can get revisions with mixed criteria', async () => {
      const namespace = 'test-namespace';
      const name = 'test-name';
      const entity = {
        namespace,
        name,
      } as unknown as ConfigurationEntity<unknown>;
      const criteria = {
        stringVal: 'test',
        numberVal: 123,
      } as unknown as RevisionCriteria;

      const findMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation((cb) => cb(null, [])),
      };
      revisionModelMock.find.mockReturnValue(findMock);

      await repository.getRevisions(entity, 10, undefined, criteria);

      expect(revisionModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          'configuration.stringVal': { $regex: 'test', $options: 'i' },
          'configuration.numberVal': 123,
        }),
        null,
        expect.any(Object)
      );
    });
  });
});
