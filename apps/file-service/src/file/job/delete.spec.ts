import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Mock, It, Times } from 'moq.ts';
import { Logger } from 'winston';
import { FileEntity } from '../model';
import { FileRepository } from '../repository';
import { createDeleteJob } from './delete';

describe('Delete Job', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  let repositoryMock: Mock<FileRepository>;

  beforeEach(() => {
    repositoryMock = new Mock<FileRepository>();
  });

  it('can be created', () => {
    const deleteJob = createDeleteJob({
      logger,
      fileRepository: repositoryMock.object(),
    });

    expect(deleteJob).toBeTruthy();
  });

  it('can be executed', async () => {
    const deleteJob = createDeleteJob({
      logger,
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.delete()).returns(Promise.resolve(true));
    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    const done = jest.fn();
    await deleteJob(tenantId, fileEntityMock.object(), done);

    fileEntityMock.verify((entity) => entity.delete());
    expect(done).toHaveBeenCalledWith();
  });
  it('can be executed without tenantId', async () => {
    const deleteJob = createDeleteJob({
      logger,
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.delete()).returns(Promise.resolve(true));
    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    const done = jest.fn();
    await deleteJob(null, fileEntityMock.object(), done);

    fileEntityMock.verify((entity) => entity.delete());
    expect(done).toHaveBeenCalledWith();
  });
  it('cannot find file', async () => {
    const deleteJob = createDeleteJob({
      logger,
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(null));

    const done = jest.fn();
    await deleteJob(tenantId, fileEntityMock.object(), done);

    fileEntityMock.verify((entity) => entity.delete(), Times.Never());
    expect(done).toHaveBeenCalledWith();
  });
  it('cannot find file also without tenant id', async () => {
    const deleteJob = createDeleteJob({
      logger,
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(null));

    const done = jest.fn();
    await deleteJob(null, fileEntityMock.object(), done);

    fileEntityMock.verify((entity) => entity.delete(), Times.Never());
    expect(done).toHaveBeenCalledWith();
  });

  it('can call done with error for failed', async () => {
    const deleteJob = createDeleteJob({
      logger,
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.delete()).returns(Promise.reject(new InvalidOperationError('failed')));
    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    const done = jest.fn();
    await deleteJob(tenantId, fileEntityMock.object(), done);

    expect(done).toHaveBeenCalledWith(expect.any(InvalidOperationError));
  });
  it('can call done with error for failed but also no tenantId', async () => {
    const deleteJob = createDeleteJob({
      logger,
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.delete()).returns(Promise.reject(new InvalidOperationError('failed')));
    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    const done = jest.fn();
    await deleteJob(null, fileEntityMock.object(), done);

    expect(done).toHaveBeenCalledWith(expect.any(InvalidOperationError));
  });
});
