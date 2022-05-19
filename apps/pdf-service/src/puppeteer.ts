import * as puppeteer from 'puppeteer';
import { PdfService } from './pdf';

class PuppeteerPdfService implements PdfService {
  constructor(private browser: puppeteer.Browser) {}

  async generatePdf(content: string): Promise<Buffer> {
    let page: puppeteer.Page;
    try {
      page = await this.browser.newPage();
      await page.setContent(content, { waitUntil: 'load', timeout: 2 * 60 * 1000 });
      return await page.pdf({ printBackground: true });
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
