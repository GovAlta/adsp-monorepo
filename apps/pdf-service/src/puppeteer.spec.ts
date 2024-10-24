import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { createPdfService } from './puppeteer';

jest.mock('puppeteer');
const puppeteerMock = puppeteer as jest.Mocked<typeof puppeteer>;

describe('puppeteer', () => {
  const browserMock = { newPage: jest.fn() };
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
      };

      const pageMock = {
        setJavaScriptEnabled: jest.fn(() => Promise.resolve()),
        setContent: jest.fn(() => Promise.resolve()),
        createPDFStream: jest.fn(() => Promise.resolve(Readable.toWeb(Readable.from('result')))),
        close: jest.fn(() => Promise.resolve()),
      };
      browserMock.newPage.mockResolvedValueOnce(pageMock);
      const result = await service.generatePdf(template);
      expect(result).toBeTruthy();
      expect(pageMock.createPDFStream).toHaveBeenCalled();
      expect(pageMock.close).toHaveBeenCalled();
    });

    it('can generate pdf wit footer and header', async () => {
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

      const pageMock = {
        setJavaScriptEnabled: jest.fn(() => Promise.resolve()),
        setContent: jest.fn(() => Promise.resolve()),
        createPDFStream: jest.fn(() => Promise.resolve(Readable.toWeb(Readable.from('result')))),
        close: jest.fn(() => Promise.resolve()),
      };
      browserMock.newPage.mockResolvedValueOnce(pageMock);
      const result = await service.generatePdf(template);
      expect(result).toBeTruthy();
      expect(pageMock.createPDFStream).toHaveBeenCalledWith(
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

      const pageMock = {
        setJavaScriptEnabled: jest.fn(() => Promise.resolve()),
        setContent: jest.fn(() => Promise.resolve()),
        createPDFStream: jest.fn(() => Promise.resolve(Readable.toWeb(Readable.from('result')))),
        close: jest.fn(() => Promise.resolve()),
      };
      browserMock.newPage.mockResolvedValueOnce(pageMock);
      const result = await service.generatePdf(template);
      expect(result).toBeTruthy();
      expect(pageMock.createPDFStream).toHaveBeenCalledWith(
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
