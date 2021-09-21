import { MongoFileSpaceRepository } from './space';
import * as NodeCache from 'node-cache';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { createLogger } from '@core-services/core-common';
import { environment } from '../environments/environment';
import { FileTypeEntity } from '../file/model/type';
import { FileSpaceEntity } from '../file/model/space';
import { FileType } from '../file/types';
import { model } from 'mongoose';

describe('Mongo: SpaceEntity', () => {
  const type: FileType = {
    id: 'type-1',
    name: 'Profile Picture',
    anonymousRead: false,
    updateRoles: ['test-admin'],
    readRoles: ['test-admin'],
    spaceId: 'space1234',
  };

  const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');
  const cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const repo = new MongoFileSpaceRepository(logger, cache as unknown as NodeCache);

  beforeEach(async () => {
    await connect();
  });

  afterEach(async () => {
    await model('filespace').deleteMany({});
    await disconnect();
  });

  it('finds a defined space', async () => {
    const entity = new FileTypeEntity(type);

    const data = await createMockData<FileSpaceEntity>(repo, [
      {
        id: 'test',
        name: 'Test',
        spaceAdminRole: 'test-admin',
        types: {
          a: entity,
        },
      },
    ]);
    const { results } = await repo.find(99, '');
    expect(results.length).toEqual(data.length);
  });
});
