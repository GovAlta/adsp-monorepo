import { AdspId } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import { ConfigurationEntityCriteria } from '../configuration';
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
  } as unknown as ValidationService;

  let repository: MongoConfigurationRepository;
  let revisionModelMock: { aggregate: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MongoConfigurationRepository(loggerMock, validationServiceMock);
    // Access the private revisionModel to mock its methods
    revisionModelMock = (repository as unknown as { revisionModel: { aggregate: jest.Mock } }).revisionModel;
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

    it('prevents injection of operator keys', async () => {
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

    it('prevents injection of object values', async () => {
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

    it('escapes regex characters', async () => {
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
  });
});
