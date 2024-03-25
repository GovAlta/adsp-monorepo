import { adspId, EventService } from '@abgov/adsp-service-sdk';
import { Mock, It, Times } from 'moq.ts';
import { Logger } from 'winston';
import { FileEntity } from '../model';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';
import { createScanJob } from './scan';

describe('Scan Job', () => {
  const serviceId = adspId`urn:ads:platform:file-service`;
  const apiId = adspId`${serviceId}:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;
  let repositoryMock: Mock<FileRepository> = null;
  let scanServiceMock: Mock<ScanService> = null;
  let eventServiceMock: Mock<EventService> = null;

  beforeEach(() => {
    repositoryMock = new Mock<FileRepository>();
    scanServiceMock = new Mock<ScanService>();
    eventServiceMock = new Mock<EventService>();
  });

  it('can be created', () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    expect(scanJob).toBeTruthy();
  });

  it('can be executed', async () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.deleted).returns(false);
    fileEntityMock
      .setup((instance) => instance.updateScanResult(true))
      .returns(Promise.resolve(fileEntityMock.object()));

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.resolve({ scanned: true, infected: true }));

    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    eventServiceMock.setup((instance) => instance.send(It.Is((event) => !!event))).returns();

    const done = jest.fn();
    await scanJob(tenantId, fileEntityMock.object(), done);
    expect(done).toHaveBeenCalledWith();
    fileEntityMock.verify((instance) => instance.updateScanResult(true));
  });

  it('can be executed and is infected', async () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.deleted).returns(false);
    fileEntityMock.setup((instance) => instance.infected).returns(true);
    fileEntityMock
      .setup((instance) => instance.updateScanResult(true))
      .returns(Promise.resolve(fileEntityMock.object()));

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.resolve({ scanned: true, infected: true }));

    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    eventServiceMock.setup((instance) => instance.send(It.Is((event) => !!event))).returns();

    const done = jest.fn();
    await scanJob(tenantId, fileEntityMock.object(), done);
    expect(done).toHaveBeenCalledWith();
    fileEntityMock.verify((instance) => instance.updateScanResult(true));
  });

  it('can be executed and is infected and null tenant', async () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.deleted).returns(false);
    fileEntityMock.setup((instance) => instance.infected).returns(true);
    fileEntityMock
      .setup((instance) => instance.updateScanResult(true))
      .returns(Promise.resolve(fileEntityMock.object()));

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.resolve({ scanned: true, infected: true }));

    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    eventServiceMock.setup((instance) => instance.send(It.Is((event) => !!event))).returns();

    const done = jest.fn();
    await scanJob(null, fileEntityMock.object(), done);
    expect(done).toHaveBeenCalledWith();
    fileEntityMock.verify((instance) => instance.updateScanResult(true));
  });
  it('can be executed and is not infected and null tenant', async () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.deleted).returns(false);
    fileEntityMock.setup((instance) => instance.infected).returns(false);
    fileEntityMock
      .setup((instance) => instance.updateScanResult(true))
      .returns(Promise.resolve(fileEntityMock.object()));

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.resolve({ scanned: true, infected: true }));

    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    eventServiceMock.setup((instance) => instance.send(It.Is((event) => !!event))).returns();

    const done = jest.fn();
    await scanJob(null, fileEntityMock.object(), done);
    expect(done).toHaveBeenCalledWith();
    fileEntityMock.verify((instance) => instance.updateScanResult(true));
  });

  it('can skip deleted', async () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.deleted).returns(true);

    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    const done = jest.fn();
    await scanJob(tenantId, fileEntityMock.object(), done);
    expect(done).toHaveBeenCalledWith();
    fileEntityMock.verify((instance) => instance.updateScanResult(It.IsAny()), Times.Never());
  });

  it('can skip not found', async () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.deleted).returns(true);

    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(null);

    const done = jest.fn();
    await scanJob(tenantId, fileEntityMock.object(), done);
    expect(done).toHaveBeenCalledWith();
    fileEntityMock.verify((instance) => instance.updateScanResult(It.IsAny()), Times.Never());
  });

  it('can skip record result for not scanned', async () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.resolve({ scanned: false, infected: false }));

    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    const done = jest.fn();
    await scanJob(tenantId, fileEntityMock.object(), done);
    expect(done).toHaveBeenCalledWith();
    fileEntityMock.verify((instance) => instance.updateScanResult(It.IsAny()), Times.Never());
  });

  it('can call done with error', async () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.reject(new Error('something failed.')));

    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    const done = jest.fn();
    await scanJob(tenantId, fileEntityMock.object(), done);
    expect(done).toHaveBeenCalledWith(expect.any(Error));
    fileEntityMock.verify((instance) => instance.updateScanResult(It.IsAny()), Times.Never());
  });
  it('can call done with error and no tenant', async () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.reject(new Error('something failed.')));

    repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(fileEntityMock.object()));

    const done = jest.fn();
    await scanJob(null, fileEntityMock.object(), done);
    expect(done).toHaveBeenCalledWith(expect.any(Error));
    fileEntityMock.verify((instance) => instance.updateScanResult(It.IsAny()), Times.Never());
  });
});
