import { adspId } from '@abgov/adsp-service-sdk';
import { createMockData } from '@core-services/core-common/mongo';
import { connect, disconnect, model } from 'mongoose';
import { MongoFileRepository } from './file';

import { FileRepository } from '../file';
import { FileType, FileCriteria, FileTypeEntity, FileEntity, FileStorageProvider, FileTypeRepository } from '../file';
import { Mock } from 'moq.ts';

describe('Mongo: FileEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const type: FileType = {
    tenantId,
    id: 'type-1',
    name: 'Profile Picture',
    anonymousRead: false,
    updateRoles: ['test-admin'],
    readRoles: ['test-admin'],
  };

  const storageProviderMock = new Mock<FileStorageProvider>();
  const typeRepository = new Mock<FileTypeRepository>();
  let repositoryMock: Mock<FileRepository> = null;

  const entity = new FileTypeEntity(type);
  typeRepository.setup((m) => m.getTypes(tenantId)).returns(Promise.resolve({ [type.id]: new FileTypeEntity(type) }));
  typeRepository.setup((m) => m.getType(tenantId, 'test')).returns(Promise.resolve(entity));
  const repo = new MongoFileRepository(storageProviderMock.object(), typeRepository.object());

  const criteria: FileCriteria = {
    deleted: false,
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const completeCriteria: FileCriteria = {
    deleted: false,
    typeEquals: 'type-1',
    recordIdEquals: '1',
    scanned: false,
    infected: false,
    filenameContains: 'bob',
    lastAccessedBefore: new Date('2021-04-21T19:26:30.667+00:00').toISOString(),
    lastAccessedAfter: new Date('2021-04-17T19:26:30.667+00:00').toISOString(),
  };

  beforeEach(async () => {
    await connect(process.env.MONGO_URL);
    repositoryMock = new Mock<FileRepository>();
  });

  afterEach(async () => {
    await model('file').deleteMany({});
    await disconnect();
  });

  it('finds a defined file', async () => {
    const entity = new FileTypeEntity(type);

    const data = await createMockData<FileEntity>(repo, [
      {
        tenantId,
        id: '1',
        recordId: '1',
        filename: 'bob.jpg',
        size: 44545454,
        createdBy: { id: '4d662274-9b23-4e2e-b058-50c3a4062609', name: 'QA-Dev DIO' },
        created: new Date('2021-04-19T19:26:30.667+00:00'),
        scanned: false,
        deleted: false,
        type: entity,
      },
    ]);
    const { results } = await repo.find(tenantId, 99, '', criteria);
    expect(results.length).toEqual(data.length);
  });

  it('get a file', async () => {
    const data = await createMockData<FileEntity>(repo, [
      {
        tenantId,
        id: '1',
        recordId: '1',
        filename: 'bob.jpg',
        size: 44545454,
        createdBy: { id: '4d662274-9b23-4e2e-b058-50c3a4062609', name: 'QA-Dev DIO' },
        created: new Date('2021-04-19T19:26:30.667+00:00'),
        lastAccessed: null,
        scanned: false,
        deleted: false,
        type: entity,
      },
    ]);
    const repoResponse = await repo.get(data[0].id);
    expect(repoResponse.id).toEqual(data[0].id);
  });

  it('get a file by query', async () => {
    const data = await createMockData<FileEntity>(repo, [
      {
        tenantId,
        id: '1',
        recordId: '1',
        filename: 'bob.jpg',
        size: 44545454,
        createdBy: { id: '4d662274-9b23-4e2e-b058-50c3a4062609', name: 'QA-Dev DIO' },
        created: new Date('2021-04-19T19:26:30.667+00:00'),
        lastAccessed: new Date('2021-04-19T19:26:30.667+00:00'),
        scanned: false,
        deleted: false,
        type: entity,
      },
    ]);
    const { results } = await repo.find(tenantId, 99, '', completeCriteria);

    expect(results.length).toEqual(data.length);
  });

  it('delete a file', async () => {
    const data = await createMockData<FileEntity>(repo, [
      {
        tenantId,
        id: '1',
        recordId: '1',
        filename: 'bob.jpg',
        size: 44545454,
        createdBy: { id: '4d662274-9b23-4e2e-b058-50c3a4062609', name: 'QA-Dev DIO' },
        created: new Date('2021-04-19T19:26:30.667+00:00'),
        lastAccessed: new Date('2021-04-19T19:26:30.667+00:00'),
        scanned: false,
        deleted: false,
        type: entity,
      },
    ]);

    const deleted = await repo.delete(data[0]);

    expect(deleted).toEqual(true);
  });

  it('save a file with a partial', async () => {
    const data = await createMockData<FileEntity>(repo, [
      {
        tenantId,
        id: '1',
        recordId: '1',
        filename: 'bob.jpg',
        size: 44545454,
        createdBy: { id: '4d662274-9b23-4e2e-b058-50c3a4062609', name: 'QA-Dev DIO' },
        created: new Date('2021-04-19T19:26:30.667+00:00'),
        lastAccessed: new Date('2021-04-19T19:26:30.667+00:00'),
        scanned: false,
        deleted: false,
        type: entity,
      },
    ]);

    const fileEntity = new FileEntity(storageProviderMock.object(), repositoryMock.object(), null, {
      tenantId,
      id: 'file-1',
      filename: 'test.txt',
      recordId: 'my-record-1',
      size: 100,
      created: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'testy',
      },
      scanned: false,
      deleted: false,
      infected: false,
    });

    const fileEntityPartial: Partial<FileEntity> = {
      filename: 'test2.txt',
      size: 200,
    };

    const repoResponse = await repo.save(fileEntity, fileEntityPartial);
    expect(repoResponse.filename).toEqual('test2.txt');
  });
});
