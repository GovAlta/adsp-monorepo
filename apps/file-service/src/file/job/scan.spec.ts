import { Mock, It, Times } from 'moq.ts';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { FileEntity } from '../model';
import { ScanService } from '../scan';
import { FileCriteria } from '../types';
import { createScanJob } from './scan';

describe('Scan Job', () => {
  const logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown) as Logger;
  let repositoryMock: Mock<FileRepository> = null;
  let scanServiceMock: Mock<ScanService> = null;

  beforeEach(() => {
    repositoryMock = new Mock<FileRepository>();
    scanServiceMock = new Mock<ScanService>();
  });

  it('can be created', () => {
    const scanJob = createScanJob({
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
    });

    expect(scanJob).toBeTruthy();
  });

  it('can be executed', (done) => {
    const scanJob = createScanJob({
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();
    fileEntityMock.setup((instance) => instance.deleted).returns(true);
    fileEntityMock
      .setup((instance) => instance.updateScanResult(true))
      .returns(Promise.resolve(fileEntityMock.object()));

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.resolve({ scanned: true, infected: true }));

    repositoryMock
      .setup((instance) =>
        instance.find(
          20,
          null,
          It.Is<FileCriteria>((c) => !c.deleted && !c.scanned)
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

    scanJob().then((infected) => {
      expect(infected).toEqual(1);
      fileEntityMock.verify((instance) => instance.updateScanResult(true));
      done();
    });
  });

  it('can skip result for not scanned', (done) => {
    const scanJob = createScanJob({
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.resolve({ scanned: false, infected: false }));

    repositoryMock
      .setup((instance) =>
        instance.find(
          20,
          null,
          It.Is<FileCriteria>((c) => !c.deleted && !c.scanned)
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

    scanJob().then((infected) => {
      expect(infected).toEqual(0);
      fileEntityMock.verify((instance) => instance.updateScanResult(It.IsAny()), Times.Never());
      done();
    });
  });

  it('can skip result for scan error', (done) => {
    const scanJob = createScanJob({
      logger,
      scanService: scanServiceMock.object(),
      fileRepository: repositoryMock.object(),
    });

    const fileEntityMock = new Mock<FileEntity>();

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.reject(new Error('something failed.')));

    repositoryMock
      .setup((instance) =>
        instance.find(
          20,
          null,
          It.Is<FileCriteria>((c) => !c.deleted && !c.scanned)
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

    scanJob().then((infected) => {
      expect(infected).toEqual(0);
      fileEntityMock.verify((instance) => instance.updateScanResult(It.IsAny()), Times.Never());
      done();
    });
  });
});
