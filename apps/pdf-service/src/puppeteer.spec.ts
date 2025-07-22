import * as puppeteer from 'puppeteer';
import { createPdfService } from './puppeteer';

jest.mock('puppeteer');
const puppeteerMock = puppeteer as jest.Mocked<typeof puppeteer>;

describe('puppeteer', () => {
  const pageMock = {
  setJavaScriptEnabled: jest.fn(),
  setContent: jest.fn(),
  pdf: jest.fn().mockResolvedValue(Buffer.from('result')),
  close: jest.fn(),
};
  const contextMock = {
  newPage: jest.fn().mockResolvedValue(pageMock),
  close: jest.fn(),
};
  const browserMock = { newPage: jest.fn(), createBrowserContext: jest.fn().mockResolvedValue(contextMock), };
  beforeAll(() => {
    puppeteerMock.launch.mockResolvedValue(browserMock as unknown as puppeteer.Browser);
  });

  beforeEach(() => {
    puppeteerMock.launch.mockClear();
    browserMock.newPage.mockClear();
  });

  it('can create pdf service', async () => {
    const service = await createPdfService();
    expect(service).toBeTruthy();
  });

  describe('PuppeteerPdfService', () => {
    it('can generate pdf without footer and header', async () => {
      const service = await createPdfService(browserMock);
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


      browserMock.newPage.mockResolvedValueOnce(pageMock);
      const result = await service.generatePdf(template);
      expect(result).toBeTruthy();
      expect(pageMock.pdf).toHaveBeenCalled();
      expect(pageMock.close).toHaveBeenCalled();
    });

    it('can generate pdf wit footer and header', async () => {
      const service = await createPdfService(browserMock);
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

      browserMock.newPage.mockResolvedValueOnce(pageMock);
      const result = await service.generatePdf(template);
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
      const service = await createPdfService();
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

      browserMock.newPage.mockResolvedValueOnce(pageMock);
      const result = await service.generatePdf(template);
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
  });
});
