import { MongoFileRepository } from './file';
import { MongoFileSpaceRepository } from './space';
import * as NodeCache from 'node-cache';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { createLogger } from '@core-services/core-common';
import { FileEntity } from '../file/model';
import { FileCriteria } from '../file/types';
import { environment } from '../environments/environment';
import { FileTypeEntity } from '../file/model/type';
import { FileType } from '../file/types';

describe('Mongo: FileEntity', () => {
  const spaceId = 'space1234';
  const type: FileType = {
    id: 'type-1',
    name: 'Profile Picture',
    anonymousRead: false,
    updateRoles: ['test-admin'],
    readRoles: ['test-admin'],
    spaceId: 'space1234',
  };

  const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');
  const cache = new NodeCache({ stdTTL: 86400, useClones: false });
  const fileRepo = new MongoFileSpaceRepository(logger, cache);
  const repo = new MongoFileRepository(fileRepo);

  const criteria: FileCriteria = {
    spaceEquals: spaceId,
    deleted: false,
  };

  beforeEach(async (done) => {
    await connect();
    done();
  });

  afterEach(async (done) => {
    await disconnect();
    done();
  });

  it('finds a defined file', async () => {
    const entity = new FileTypeEntity(type);

    const data = await createMockData<FileEntity>(repo, [
      {
        id: '1',
        recordId: '1',
        filename: 'bob.jpg',
        size: 44545454,
        storage: '6b9e2a75',
        createdBy: { id: '4d662274-9b23-4e2e-b058-50c3a4062609', name: 'QA-Dev DIO' },
        created: new Date('2021-04-19T19:26:30.667+00:00'),
        lastAccessed: null,
        scanned: false,
        deleted: false,
        type: entity,
      },
    ]);
    const { results } = await repo.find(99, '', criteria);
    expect(results.length).toEqual(data.length);
  });
});
