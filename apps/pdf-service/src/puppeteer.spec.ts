import { createPdfService } from './puppeteer';

describe('puppeteer', () => {
  it('can create pdf service', () => {
    const service = createPdfService();
    expect(service).toBeTruthy();
  });

  describe('PuppeteerPdfService', () => {
    const service = createPdfService();

    it('can generate pdf', async () => {
      const result = await service.generatePdf(`<!doctype html>
      <html lang=en>
      <head>
      <meta charset=utf-8>
      <title>This is a title.</title>
      </head>
      <body>
      <p>I'm the content</p>
      </body>
      </html>`);
      expect(result).toBeTruthy();
    });
  });
});
