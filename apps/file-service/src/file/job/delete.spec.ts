import { Mock, It } from 'moq.ts';
import { Logger } from 'winston';
import { InvalidOperationError } from '@core-services/core-common';
import { FileRepository } from '../repository';
import { createDeleteJob } from './delete';
import { FileCriteria } from '../types';
import { FileEntity } from '../model';

describe('Delete Job', () => {
  const logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown) as Logger;
  let repositoryMock: Mock<FileRepository> = null;

  beforeEach(() => {
    repositoryMock = new Mock<FileRepository>();
  });

  it('can be created', () => {
    const deleteJob = createDeleteJob({
      logger,
      rootStoragePath: './files',
      fileRepository: repositoryMock.object(),
    });

    expect(deleteJob).toBeTruthy();
  });

  it('can be executed', (done) => {
    const deleteJob = createDeleteJob({
      logger,
      rootStoragePath: './files',
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.delete('./files')).returns(Promise.resolve(true));

    repositoryMock
      .setup((instance) =>
        instance.find(
          20,
          null,
          It.Is<FileCriteria>((c) => !!c.deleted)
        )
      )
      .returns(
        Promise.resolve({
          page: {
            size: 1,
            after: null,
            next: null,
          },
          results: [fileEntityMock.object()],
        })
      );

    deleteJob().then((deleted) => {
      expect(deleted).toEqual(1);
      done();
    });
  });

  it('can exclude not deleted from count', (done) => {
    const deleteJob = createDeleteJob({
      logger,
      rootStoragePath: './files',
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.delete('./files')).returns(Promise.resolve(false));

    repositoryMock
      .setup((instance) =>
        instance.find(
          20,
          null,
          It.Is<FileCriteria>((c) => !!c.deleted)
        )
      )
      .returns(
        Promise.resolve({
          page: {
            size: 1,
            after: null,
            next: null,
          },
          results: [fileEntityMock.object()],
        })
      );

    deleteJob().then((deleted) => {
      expect(deleted).toEqual(0);
      done();
    });
  });

  it('can exclude not failed from count', (done) => {
    const deleteJob = createDeleteJob({
      logger,
      rootStoragePath: './files',
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.getFilePath('./files')).returns('./files/test-file');

    fileEntityMock
      .setup((instance) => instance.delete('./files'))
      .returns(Promise.reject(new InvalidOperationError('failed')));

    repositoryMock
      .setup((instance) =>
        instance.find(
          20,
          null,
          It.Is<FileCriteria>((c) => !!c.deleted)
        )
      )
      .returns(
        Promise.resolve({
          page: {
            size: 1,
            after: null,
            next: null,
          },
          results: [fileEntityMock.object()],
        })
      );

    deleteJob().then((deleted) => {
      expect(deleted).toEqual(0);
      done();
    });
  });
});
