import { adspId } from '@abgov/adsp-service-sdk';
import { createMockData } from '@core-services/core-common/mongo';
import { connect, disconnect, model } from 'mongoose';
import { MongoFileRepository } from './file';
import { FileType, FileCriteria, FileTypeEntity, FileEntity, FileStorageProvider, FileTypeRepository } from '../file';
import { It, Mock } from 'moq.ts';

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
  typeRepository.setup((m) => m.getTypes(tenantId)).returns(Promise.resolve({ [type.id]: new FileTypeEntity(type) }));
  const repo = new MongoFileRepository(storageProviderMock.object(), typeRepository.object());

  const criteria: FileCriteria = {
    deleted: false,
  };

  beforeEach(async () => {
    await connect(process.env.MONGO_URL);
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
        lastAccessed: null,
        scanned: false,
        deleted: false,
        type: entity,
      },
    ]);
    const { results } = await repo.find(tenantId, 99, '', criteria);
    expect(results.length).toEqual(data.length);
  });
});
