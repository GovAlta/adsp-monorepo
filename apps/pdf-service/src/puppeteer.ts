import * as puppeteer from 'puppeteer';
import { PdfService, PdfServiceProps } from './pdf';

class PuppeteerPdfService implements PdfService {
  constructor(private browser: puppeteer.Browser) {}

  async generatePdf({ content, header, footer }: PdfServiceProps): Promise<Buffer> {
    let page: puppeteer.Page;
    try {
      page = await this.browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setContent(content, { waitUntil: 'load', timeout: 2 * 60 * 1000 });
      if (header || footer) {
        const headerTemplate = !header ? '' : header;
        const footerTemplate = !footer ? '' : footer;

        return await page.pdf({
          headerTemplate,
          footerTemplate,
          printBackground: true,
          displayHeaderFooter: true,
          omitBackground: true,
        });
      } else {
        return await page.pdf({ printBackground: true, omitBackground: true });
      }
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}

export async function createPdfService(): Promise<PdfService> {
  const browser = await puppeteer.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
  return new PuppeteerPdfService(browser);
}
