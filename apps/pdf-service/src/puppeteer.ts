import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { PdfService, PdfServiceProps } from './pdf';
import { Semaphore } from 'await-semaphore';

const MAX_HTML_SIZE = 5_000_000;
const WARN_HTML_SIZE = 1_000_000;
const MAX_PDF_CONCURRENCY = 4;
const CONTENT_TIMEOUT = 2 * 60 * 1000;

const pdfLimiter = new Semaphore(MAX_PDF_CONCURRENCY);

class PuppeteerPdfService implements PdfService {
  constructor(private browser: puppeteer.Browser) {}

  async generatePdf({ content, header, footer, logger }: PdfServiceProps): Promise<Readable> {
    const release = await pdfLimiter.acquire();
    let page: puppeteer.Page | null = null;
    let context: puppeteer.BrowserContext | null = null;

    try {
      const htmlSize = Buffer.byteLength(content, 'utf8');
      logger?.warn(`HTML size: ${htmlSize.toLocaleString()} bytes`);

      if (htmlSize > WARN_HTML_SIZE) {
        logger?.warn(`HTML content is large (${(htmlSize / 1_000_000).toFixed(2)}MB)`);
      }
      if (htmlSize > MAX_HTML_SIZE) {
        throw new Error('HTML content too large for PDF generation');
      }

      context = await this.browser.createBrowserContext();
      page = await context.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setContent(content, { waitUntil: 'networkidle0', timeout: 2 * 60 * 1000 });

      // Timeout fallback
      await Promise.race([
        page.setContent(content, {
          waitUntil: ['domcontentloaded', 'networkidle2'],
          timeout: CONTENT_TIMEOUT,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('⏰ setContent hard timeout')), CONTENT_TIMEOUT)),
      ]);

      const pdfOptions: puppeteer.PDFOptions = {
        printBackground: true,
        omitBackground: true,
      };

      if (header || footer) {
        pdfOptions.displayHeaderFooter = true;
        pdfOptions.headerTemplate = header || '';
        pdfOptions.footerTemplate = footer || '';
      }

      const buffer = await page.pdf(pdfOptions);
      return Readable.from(buffer);
    } finally {
      if (page) await page.close();
      if (context) await context.close();
      release();
    }
  }
}

//eslint-disable-next-line
export async function createPdfService(brow: puppeteer.Browser | null = null): Promise<PdfService> {
  const browser =
    brow ??
    (await puppeteer.launch({
      headless: true,
      protocolTimeout: 30_000,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    }));

  return new PuppeteerPdfService(browser);
}
