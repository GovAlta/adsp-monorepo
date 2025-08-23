import * as puppeteer from 'puppeteer';
import { checkPDFSize, createPdfService } from './puppeteer';
import { Logger } from 'winston';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { withTimeout } from './puppeteer';

jest.mock('puppeteer');
const puppeteerMock = puppeteer as jest.Mocked<typeof puppeteer>;

const loggerMock = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
} as unknown as Logger;

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      ...originalFs.promises,
      rm: jest.fn(),
    },
  };
});

const browserEmitter = new EventEmitter();

const pageMock = {
  setJavaScriptEnabled: jest.fn().mockResolvedValue(undefined),
  setRequestInterception: jest.fn().mockResolvedValue(undefined),
  setContent: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(Buffer.from('result')),
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

const contextMock = {
  newPage: jest.fn().mockResolvedValue(pageMock),
  close: jest.fn().mockResolvedValue(undefined),
};
const browserMock = {
  newPage: jest.fn().mockResolvedValue(pageMock),
  createBrowserContext: jest.fn().mockResolvedValue(contextMock),
  on: browserEmitter.on.bind(browserEmitter),
  once: browserEmitter.once.bind(browserEmitter),
  off: browserEmitter.off.bind(browserEmitter),
  removeListener: browserEmitter.removeListener.bind(browserEmitter),
} as unknown as jest.Mocked<puppeteer.Browser>;

describe('puppeteer', () => {
  beforeAll(() => {
    puppeteerMock.launch.mockResolvedValue(browserMock as unknown as puppeteer.Browser);
  });

  beforeEach(() => {
    puppeteerMock.launch.mockClear();
  });

  it('can create pdf service', async () => {
    const service = await createPdfService(loggerMock, browserMock);
    expect(service).toBeTruthy();
  });

  describe('PuppeteerPdfService', () => {
    it('can generate pdf without footer and header', async () => {
      const service = await createPdfService(loggerMock, browserMock);
      const template = {
        content: `<!doctype html>
        <html lang=en>
        <head>
        <meta charset=utf-8>
        <title>This is a title.</title>
        </head>
        <body>
        <p>I'm the content</p>
        </body>
        </html>`,
      };

      contextMock.newPage.mockResolvedValueOnce(pageMock);
      const result = await service.generatePdf({ ...template, logger: loggerMock });
      expect(result).toBeTruthy();
      expect(pageMock.pdf).toHaveBeenCalled();
      expect(pageMock.close).toHaveBeenCalled();
    });

    it('can generate pdf wit footer and header', async () => {
      const service = await createPdfService(loggerMock, browserMock);
      const template = {
        content: `<!doctype html>
        <html lang=en>
        <head>
        <meta charset=utf-8>
        <title>This is a title.</title>
        </head>
        <body>
        <p>I'm the content</p>
        </body>
        </html>
        `,
        footer: `
        <div>
          <p>
            footer
          </p>
        </div>`,
        header: `
          <div>
            <p>
              header
            </p>
          </div>`,
      };

      contextMock.newPage.mockResolvedValueOnce(pageMock);
      const result = await service.generatePdf({ ...template, logger: loggerMock });
      expect(result).toBeTruthy();
      expect(pageMock.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: template.header,
          footerTemplate: template.footer,
          displayHeaderFooter: true,
        })
      );
      expect(pageMock.close).toHaveBeenCalled();
    });

    it('can handle partial header footer', async () => {
      const service = await createPdfService(loggerMock, browserMock);
      const template = {
        content: `<!doctype html>
        <html lang=en>
        <head>
        <meta charset=utf-8>
        <title>This is a title.</title>
        </head>
        <body>
        <p>I'm the content</p>
        </body>
        </html>`,
        footer: `
        <div>
          <p>
            footer
          </p>
        </div>`,
      };

      contextMock.newPage.mockResolvedValueOnce(pageMock);
      const result = await service.generatePdf({ ...template, logger: loggerMock });
      expect(result).toBeTruthy();
      expect(pageMock.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          headerTemplate: '',
          footerTemplate: template.footer,
          displayHeaderFooter: true,
        })
      );
      expect(pageMock.close).toHaveBeenCalled();
    });

    it('will warn when content is large', async () => {
      checkPDFSize(1_000_001, loggerMock);
      expect(loggerMock.warn).toHaveBeenCalledWith('Large HTML content: 1.00MB');
    });

    it('will throw when content is too large', () => {
      expect(() => checkPDFSize(10_000_001, loggerMock)).toThrow(
        'HTML content is too large for PDF generation: 10.00MB'
      );
    });
  });

  describe('PuppeteerPdfService restartBrowser', () => {
    // eslint-disable-next-line
    let service: any; // your PuppeteerPdfService instance

    beforeEach(async () => {
      // create service instance however you do it
      service = await createPdfService(loggerMock, browserMock);
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('restarts browser successfully', async () => {
      service.currentUserDataDir = '/tmp/old-dir';
      (fs.rm as jest.Mock).mockResolvedValue(undefined);
      service.browser.close = jest.fn().mockResolvedValue(undefined);
      puppeteerMock.launch.mockResolvedValue(browserMock);

      await service.restartBrowser();

      expect(service.browser.close).toHaveBeenCalled();
      expect(fs.rm).toHaveBeenCalledWith('/tmp/old-dir', { recursive: true, force: true });
      expect(puppeteerMock.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.arrayContaining([expect.stringContaining(service.currentUserDataDir)]),
        })
      );
      expect(service.jobCount).toBe(0);
      expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Closing Browser...'));
      expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Launching new Chromium instance'));
      expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Chromium relaunched'));
    });

    it('handles error when closing browser and deleting temp dir', async () => {
      service.currentUserDataDir = '/tmp/old-dir';
      service.browser.close = jest.fn().mockRejectedValue(new Error('close failed'));
      (fs.rm as jest.Mock).mockRejectedValue(new Error('rm failed'));
      puppeteerMock.launch.mockResolvedValue(browserMock);

      await service.restartBrowser();

      expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to close browser'));
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to delete temp dir'));
    });

    it('skips deleting temp dir if none', async () => {
      service.currentUserDataDir = null;
      service.browser.close = jest.fn().mockResolvedValue(undefined);
      puppeteerMock.launch.mockResolvedValue(browserMock);

      await service.restartBrowser();

      expect(fs.rm).not.toHaveBeenCalled();
    });
  });

  describe('generatePdf retry logic', () => {
    // eslint-disable-next-line
    let service: any;

    beforeEach(async () => {
      service = await createPdfService(loggerMock, browserMock);
    });

    it('retries on Protocol error and calls restartBrowser', async () => {
      const error = new Error('Protocol error: something went wrong');

      // Mock _generatePdfOnce to fail once, then succeed
      const generateSpy = jest
        // eslint-disable-next-line
        .spyOn(service as any, '_generatePdfOnce')
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(Buffer.from('pdf-result'));
      // eslint-disable-next-line
      const restartSpy = jest.spyOn(service as any, 'restartBrowser').mockResolvedValue(undefined);

      const result = await service.generatePdf({ content: '<html></html>', logger: loggerMock });

      expect(loggerMock.warn).toHaveBeenCalledWith('Browser crash detected — retrying with fresh browser...');
      expect(restartSpy).toHaveBeenCalledTimes(1);
      expect(generateSpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual(Buffer.from('pdf-result'));
    });

    it('rethrows non-Protocol errors', async () => {
      const error = new Error('Some other error');
      // eslint-disable-next-line
      jest.spyOn(service as any, '_generatePdfOnce').mockRejectedValue(error);

      await expect(service.generatePdf({ content: '<html></html>', logger: loggerMock })).rejects.toThrow(
        'Some other error'
      );
    });

    it('logs and restarts browser on disconnected event', async () => {
      // eslint-disable-next-line
      jest.spyOn(service as any, 'restartBrowser').mockResolvedValue(undefined);
      // Emit 'disconnected' event
      await browserEmitter.emit('disconnected');

      // Allow any async event handlers to run
      await new Promise(process.nextTick);

      expect(loggerMock.warn).toHaveBeenCalledWith('Browser disconnected — restarting...');
      // eslint-disable-next-line
      expect((service as any).restartBrowser).toHaveBeenCalled();
    });

    it('logs and restarts browser on disconnected event xx', async () => {
      // eslint-disable-next-line
      jest.spyOn(service as any, 'restartBrowser').mockResolvedValue(undefined);

      browserEmitter.emit('disconnected');

      // allow async listener to run
      await Promise.resolve();

      expect(loggerMock.warn).toHaveBeenCalledWith('Browser disconnected — restarting...');
      // eslint-disable-next-line
      expect((service as any).restartBrowser).toHaveBeenCalled();
    });
  });

  const MAX_JOBS_BEFORE_RESTART = 4; // or import actual value if exposed

  it('restarts browser after max jobs reached', async () => {
    const service = await createPdfService(loggerMock, browserMock, 4);
    // eslint-disable-next-line
    jest.spyOn(service as any, 'restartBrowser').mockResolvedValue(undefined);

    service.jobCount = MAX_JOBS_BEFORE_RESTART - 1;

    // Call method that increments jobCount (e.g., generatePdf or a specific job method)
    await service.generatePdf({ content: '<html></html>', logger: loggerMock });

    // Check that jobCount incremented to MAX_JOBS_BEFORE_RESTART
    expect(service.jobCount).toBe(MAX_JOBS_BEFORE_RESTART);

    // Check logger info for restart message

    (loggerMock.info as jest.Mock).mock.calls.forEach((call, index) => {
      console.log(`Call ${index + 1}:`, ...call);
    });

    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Restarting browser after 4 jobs'));

    console.log('loggerMock.info calls:', loggerMock.info);

    // Check restartBrowser called
    // eslint-disable-next-line
    expect((service as any).restartBrowser).toHaveBeenCalled();
  });

  it('blocks font requests', async () => {
    const service = await createPdfService(loggerMock, browserMock);

    // Capture the handler passed to page.on('request', ...)
    // eslint-disable-next-line
    let requestHandler: (req: any) => void;
    (pageMock.on as jest.Mock).mockImplementation((eventName, handler) => {
      if (eventName === 'request') {
        requestHandler = handler;
      }
    });

    await service.generatePdf({ content: '<html></html>', logger: loggerMock });

    // Mock request object
    const reqMock = {
      url: () => 'https://use.typekit.net/somefont.js',
      abort: jest.fn(),
      continue: jest.fn(),
    };

    // call the captured handler manually
    requestHandler!(reqMock);

    expect(reqMock.abort).toHaveBeenCalled();
    expect(reqMock.continue).not.toHaveBeenCalled();
    expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('Blocking font request'));
  });

  it('continues non-Typekit requests', async () => {
    const service = await createPdfService(loggerMock, browserMock);

    // Capture the handler passed to page.on('request', ...)
    // eslint-disable-next-line
    let requestHandler: (req: any) => void;
    (pageMock.on as jest.Mock).mockImplementation((eventName, handler) => {
      if (eventName === 'request') {
        requestHandler = handler;
      }
    });

    await service.generatePdf({ content: '<html></html>', logger: loggerMock });

    // mock a normal request
    const reqMock = {
      url: () => 'https://example.com/something.js',
      abort: jest.fn(),
      continue: jest.fn(),
    };

    // call the registered request handler manually
    requestHandler!(reqMock);

    expect(reqMock.continue).toHaveBeenCalled();
    expect(reqMock.abort).not.toHaveBeenCalled();
  });

  it('logs when a request fails', async () => {
    const service = await createPdfService(loggerMock, browserMock);

    // Capture the handler passed to page.on('requestfailed', ...)
    // eslint-disable-next-line
    let requestFailedHandler: (req: any) => void;
    (pageMock.on as jest.Mock).mockImplementation((eventName, handler) => {
      if (eventName === 'requestfailed') {
        requestFailedHandler = handler;
      }
    });

    await service.generatePdf({ content: '<html></html>', logger: loggerMock });

    // Mock a request failure
    const reqMock = {
      url: () => 'https://example.com/some.css',
      failure: () => ({ errorText: 'Network error' }),
    };

    // Call the captured handler manually
    requestFailedHandler!(reqMock);

    expect(loggerMock.warn).toHaveBeenCalledWith('Failed Request: https://example.com/some.css - Network error');
  });

  it('logs and rethrows when setContent fails', async () => {
    const service = await createPdfService(loggerMock, browserMock);

    // Make setContent reject
    const error = new Error('boom');
    pageMock.setContent = jest.fn().mockRejectedValue(error);

    // We expect the call to generatePdf to reject
    await expect(service.generatePdf({ content: '<html></html>', logger: loggerMock })).rejects.toThrow('boom');

    expect(loggerMock.error).toHaveBeenCalledWith('Error setting content:', 'boom');
  });

  it('rejects after given timeout', async () => {
    jest.useFakeTimers();
    const never = new Promise(() => {});
    const call = withTimeout(never, 1000, 'boom');

    jest.advanceTimersByTime(1001);
    await expect(call).rejects.toThrow('boom');
  });
});
