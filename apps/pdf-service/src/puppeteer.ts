import * as puppeteer from 'puppeteer';
import { PdfService } from './pdf';

class PuppeteerPdfService implements PdfService {
  async generatePdf(content: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
    try {
      const page = await browser.newPage();
      await page.setContent(content);
      return await page.pdf();
    } finally {
      await browser.close();
    }
  }
}

export function createPdfService(): PdfService {
  return new PuppeteerPdfService();
}
