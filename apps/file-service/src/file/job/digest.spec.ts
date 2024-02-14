import { adspId } from '@abgov/adsp-service-sdk';
import { createReadStream } from 'fs';
import { It, Mock } from 'moq.ts';
import { Logger } from 'winston';
import { createDigestJob } from './digest';
import { FileRepository } from '../repository';
import { FileEntity } from '../model';
import { File } from '../types';
import { NotFoundError } from '@core-services/core-common';

describe('digest', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;
  let repositoryMock: Mock<FileRepository> = null;

  beforeEach(() => {
    repositoryMock = new Mock<FileRepository>();
  });

  it('can create job', () => {
    const job = createDigestJob({ logger, fileRepository: repositoryMock.object() });
    expect(job).toBeTruthy();
  });

  it('can digest file', async () => {
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const fileEntityMock = new Mock<FileEntity>();

    const stream = createReadStream(__filename);
    fileEntityMock.setup((instance) => instance.readFile(It.IsAny<object>())).returns(Promise.resolve(stream));
    fileEntityMock
      .setup((instance) => instance.updateDigest(It.IsAny<string>()))
      .returns(Promise.resolve(fileEntityMock.object()));
    repositoryMock.setup((instance) => instance.get('test')).returns(Promise.resolve(fileEntityMock.object()));

    const job = createDigestJob({ logger, fileRepository: repositoryMock.object() });
    const done = jest.fn();
    await job(tenantId, { id: 'test', filename: 'test' } as File, done);
    fileEntityMock.verify((instance) =>
      instance.updateDigest(
        It.Is((value) => {
          return typeof value === 'string';
        })
      )
    );
    expect(done).toHaveBeenCalledWith();
  });

  it('can handle error', async () => {
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const fileEntityMock = new Mock<FileEntity>();

    const stream = createReadStream(__filename);
    fileEntityMock.setup((instance) => instance.readFile(It.IsAny<object>())).returns(Promise.resolve(stream));
    fileEntityMock
      .setup((instance) => instance.updateDigest(It.IsAny<string>()))
      .returns(Promise.resolve(fileEntityMock.object()));
    const error = new NotFoundError('file');
    repositoryMock.setup((instance) => instance.get('test')).throws(error);

    const job = createDigestJob({ logger, fileRepository: repositoryMock.object() });
    const done = jest.fn();
    await job(tenantId, { id: 'test', filename: 'test' } as File, done);
    expect(done).toHaveBeenCalledWith(error);
  });
});
