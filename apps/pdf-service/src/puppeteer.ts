import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { PdfService, PdfServiceProps } from './pdf';
import { Semaphore } from 'await-semaphore';
import { Logger } from 'winston';

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
      logger?.info('HTML size (bytes):', Buffer.byteLength(content, 'utf8'));
      logger?.info('Starts with:', content.slice(0, 100));
      checkPDFSize(content.length, logger);

      context = await this.browser.createBrowserContext();
      page = await context.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (url.includes('use.typekit.net')) {
          logger.warn(`🚫 Blocking font request: ${url}`);
          req.abort();
        } else {
          req.continue();
        }
      });
      page.on('request', (req) => console.log(`Request: ${req.url()}`));
      page.on('response', (res) => console.log(`Response: ${res.url()} (${res.status()})`));
      page.on('requestfailed', (req) => console.warn(`Failed Request: ${req.url()} - ${req.failure()?.errorText}`));

      await Promise.race([
        page
          .setContent(content, {
            waitUntil: ['domcontentloaded', 'networkidle2'],
            timeout: CONTENT_TIMEOUT,
          })
          .catch((err) => {
            logger?.error('Error setting content:', err.message);
            throw err;
          }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('setContent hard timeout')), CONTENT_TIMEOUT)),
      ]);

      const height = await page.evaluate(() => document.body.scrollHeight);
      logger?.info(`Page scroll height: ${height}`);

      const pdfOptions: puppeteer.PDFOptions = {
        printBackground: true,
        omitBackground: true,
      };

      if (header || footer) {
        pdfOptions.displayHeaderFooter = true;
        pdfOptions.headerTemplate = header || '';
        pdfOptions.footerTemplate = footer || '';
      }

      const buffer = await timeIt(logger, () => page.pdf(pdfOptions));
      return Readable.from(buffer);
    } finally {
      if (page) await page.close().catch((err) => logger?.error('Error closing page:', err));
      if (context) await context.close().catch((err) => logger?.error('Error closing context:', err));
      release();
    }
  }
}

export async function timeIt<T>(logger: Logger, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  logger?.info(`PDF generated in ${duration}ms`);
  return result;
}

export const checkPDFSize = (length: number, logger?: Logger) => {
  if (length > WARN_HTML_SIZE) {
    logger?.warn(`Large HTML content: ${(length / 1_000_000).toFixed(2)}MB`);
  }
  if (length > MAX_HTML_SIZE) {
    throw new Error(`HTML content is too large for PDF generation: ${(length / 1_000_000).toFixed(2)}MB`);
  }
};

//eslint-disable-next-line
export async function createPdfService(brow: puppeteer.Browser | null = null): Promise<PdfService> {
  const userDataDir = `/tmp/chrome-${Date.now()}`;
  const browser =
    brow ??
    (await puppeteer.launch({
      headless: true,
      protocolTimeout: 30_000,
      args: ['--disable-dev-shm-usage', '--no-sandbox', `--user-data-dir=${userDataDir}`],
    }));

  return new PuppeteerPdfService(browser);
}
