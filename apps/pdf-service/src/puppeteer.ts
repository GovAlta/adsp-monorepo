import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { PdfService, PdfServiceProps } from './pdf';



class PuppeteerPdfService implements PdfService {
  constructor(private browser: puppeteer.Browser) {}

  async generatePdf({ content, header, footer }: PdfServiceProps): Promise<Readable> {
    let page: puppeteer.Page;
    try {

      page = await this.browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setContent(content, { waitUntil: 'networkidle0', timeout: 2 * 60 * 1000 });

      let result: Buffer;
      if (header || footer) {
        const headerTemplate = !header ? '' : header;
        const footerTemplate = !footer ? '' : footer;

        result = await page.pdf({
            headerTemplate,
            footerTemplate,
            printBackground: true,
            displayHeaderFooter: true,
            omitBackground: true,
          });
      } else {
        result = await page.pdf({ printBackground: true, omitBackground: true });
      }
      return Readable.from(result);
    } finally {
      if (page && !page.isClosed()) {
        await page.close().catch((err) => console.error('Error closing page', err));
      }
    }
  }
}

//eslint-disable-next-line
export async function createPdfService(brow: puppeteer.Browser | null = null): Promise<PdfService> {
  const browser =
    brow ??
    (await puppeteer.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    }));

  return new PuppeteerPdfService(browser);
}