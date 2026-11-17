import { adspId, EventService } from '@abgov/adsp-service-sdk';
import { Mock, It, Times } from 'moq.ts';
import { Logger } from 'winston';
import { FileEntity } from '../model';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';
import { FileScanCompletedAuditAction, FileScanThreatFoundAuditAction, FileServiceJobAuditActor } from '../audit';
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
  const auditServiceMock = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };

  beforeEach(() => {
    repositoryMock = new Mock<FileRepository>();
    scanServiceMock = new Mock<ScanService>();
    eventServiceMock = new Mock<EventService>();
    auditServiceMock.record.mockReset();
  });

  it('can be created', () => {
    const scanJob = createScanJob({
      apiId,
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
      eventService: eventServiceMock.object(),
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
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
      auditService: auditServiceMock,
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

  describe('audit', () => {
    const createJob = (scanService: ScanService) =>
      createScanJob({
        apiId,
        logger,
        scanService,
        fileRepository: repositoryMock.object(),
        eventService: { send: jest.fn() },
        auditService: auditServiceMock,
      });

    const createFile = () =>
      ({
        tenantId,
        id: 'file-1',
        filename: 'invoice.pdf',
        typeId: 'supporting-documents',
        recordId: 'application-123',
        size: 100,
        deleted: false,
        updateScanResult: jest.fn(function (infected: boolean) {
          this.scanned = true;
          this.infected = infected;
          return Promise.resolve(this);
        }),
      }) as unknown as FileEntity;

    it('records scan completed for a clean file', async () => {
      const file = createFile();
      repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(file));
      const scanJob = createJob({ scan: jest.fn().mockResolvedValue({ scanned: true, infected: false }) });

      const done = jest.fn();
      await scanJob(tenantId, file, done);

      expect(done).toHaveBeenCalledWith();
      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileScanCompletedAuditAction,
        expect.objectContaining({
          tenantId,
          actor: FileServiceJobAuditActor,
          resource: { type: 'file', id: 'file-1', name: 'invoice.pdf' },
          metadata: expect.objectContaining({ scanResult: 'clean', recordId: 'application-123' }),
        }),
      );
    });

    it('records scan completed and critical threat found for an infected file', async () => {
      const file = createFile();
      repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(file));
      const scanJob = createJob({
        scan: jest.fn().mockResolvedValue({ scanned: true, infected: true, threats: ['Eicar-Signature'] }),
      });

      await scanJob(tenantId, file, jest.fn());

      expect(auditServiceMock.record).toHaveBeenCalledTimes(2);
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileScanCompletedAuditAction,
        expect.objectContaining({
          metadata: expect.objectContaining({ scanResult: 'threat', threats: ['Eicar-Signature'] }),
        }),
      );
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileScanThreatFoundAuditAction,
        expect.objectContaining({
          resource: { type: 'file', id: 'file-1', name: 'invoice.pdf' },
          metadata: expect.objectContaining({ threats: ['Eicar-Signature'] }),
        }),
      );
      expect(FileScanThreatFoundAuditAction.severity).toBe('critical');
    });

    it('records threat found without threat names when the provider does not report them', async () => {
      const file = createFile();
      repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(file));
      const scanJob = createJob({ scan: jest.fn().mockResolvedValue({ scanned: true, infected: true }) });

      await scanJob(tenantId, file, jest.fn());

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        FileScanThreatFoundAuditAction,
        expect.objectContaining({ metadata: expect.not.objectContaining({ threats: expect.anything() }) }),
      );
    });

    it('does not record when the file is not scanned', async () => {
      const file = createFile();
      repositoryMock.setup((instance) => instance.get(It.IsAny())).returns(Promise.resolve(file));
      const scanJob = createJob({ scan: jest.fn().mockResolvedValue({ scanned: false, infected: false }) });

      await scanJob(tenantId, file, jest.fn());

      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });
  });
});
