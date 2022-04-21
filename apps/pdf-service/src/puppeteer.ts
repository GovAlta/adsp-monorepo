import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { PdfService } from './pdf';

class PuppeteerPdfService implements PdfService {
  async generatePdf(content: string): Promise<Readable> {
    const browser = await puppeteer.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
    try {
      const page = await browser.newPage();
      await page.setContent(content);
      return await page.createPDFStream();
    } finally {
      await browser.close();
    }
  }
}

export function createPdfService(): PdfService {
  return new PuppeteerPdfService();
}
