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
      if (header !== null || footer !== null) {
        const _header = header === null ? '' : header;
        const _footer = footer === null ? '' : footer;
        return await page.pdf({
          footerTemplate: _footer,
          headerTemplate: _header,
          printBackground: true,
          displayHeaderFooter: true,
        });
      } else {
        return await page.pdf({ printBackground: true });
      }
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}

export async function createPdfService(): Promise<PdfService> {
  const browser = await puppeteer.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  return new PuppeteerPdfService(browser);
}
