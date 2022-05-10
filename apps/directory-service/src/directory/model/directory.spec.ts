import { DirectoryEntity } from './directory';
import { DirectoryRepository } from '../repository';
import { It, Mock } from 'moq.ts';
import { Directory } from '../types/directory';

describe('DirectoryEntity', () => {
  const testDirectory: Directory = {
    id: '60d4fadbb662612a75295749',
    name: 'platform',
    services: [
      {
        service: 'tenant-service',
        host: 'http://tenant-management-api:3333',
      },
    ],
  };

  it('creates a directory', async () => {
    const repositoryMock = new Mock<DirectoryRepository>();
    const entity = new DirectoryEntity(repositoryMock.object(), testDirectory);
    repositoryMock.setup((m) => m.save(It.IsAny())).returns(Promise.resolve(entity));
    const newEntity = await DirectoryEntity.create(repositoryMock.object(), testDirectory);
    expect(newEntity).toBeTruthy();
    expect(newEntity.name).toBeTruthy();
    expect(newEntity.services).toBeTruthy();
    expect(newEntity.services.length).toBe(1);
  });

  it('updates all directory params', async () => {
    const repositoryMock = new Mock<DirectoryRepository>();
    const entity = new DirectoryEntity(repositoryMock.object(), testDirectory);
    repositoryMock.setup((m) => m.save(It.IsAny())).returns(Promise.resolve(entity));
    const updatedDirectory: Directory = {
      id: '60d4fadbb662612a75295748',
      name: 'platform-service',
      services: [
        {
          service: 'tenant-service',
          host: 'http://tenant-management-api:3333',
        },
        {
          service: 'tenant-service:v2',
          host: 'http://tenant-management-api:3333/api/tenant/v2',
        },
      ],
    };

    const newEntity = await entity.update(updatedDirectory);
    expect(newEntity).toBeTruthy();
    expect(newEntity.name).toBe(updatedDirectory.name);
    expect(newEntity.services.length).toBe(2);
  });

  it('updates the directory name', async () => {
    const repositoryMock = new Mock<DirectoryRepository>();
    const entity = new DirectoryEntity(repositoryMock.object(), testDirectory);
    repositoryMock.setup((m) => m.save(It.IsAny())).returns(Promise.resolve(entity));
    const newName = 'platform-service';
    const newEntity = await entity.update({ name: newName });
    expect(newEntity).toBeTruthy();
    expect(newEntity.name).toBe(newName);
    expect(newEntity.services.length).toBe(testDirectory.services.length);
  });

  it('updates the directory services', async () => {
    const repositoryMock = new Mock<DirectoryRepository>();
    const entity = new DirectoryEntity(repositoryMock.object(), testDirectory);
    repositoryMock.setup((m) => m.save(It.IsAny())).returns(Promise.resolve(entity));
    const services = [
      {
        service: 'tenant-service',
        host: 'http://tenant-management-api:3333',
      },
      {
        service: 'tenant-service:v2',
        host: 'http://tenant-management-api:3333/api/tenant/v2',
      },
    ];
    const newEntity = await entity.update({ services });
    expect(newEntity).toBeTruthy();
    expect(newEntity.name).toBe(testDirectory.name);
    expect(newEntity.services.length).toBe(services.length);
  });
});
