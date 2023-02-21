import { createPdfService } from './puppeteer';

describe('puppeteer', () => {
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

      const result = await service.generatePdf(template);
      expect(result).toBeTruthy();
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

      const result = await service.generatePdf(template);
      expect(result).toBeTruthy();
    });
  });
});
