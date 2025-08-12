import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { PdfService, PdfServiceProps } from './pdf';
import { Semaphore } from 'await-semaphore';
import { Logger } from 'winston';
import { promises as fs } from 'fs';

const MAX_HTML_SIZE = 5_000_000;
const WARN_HTML_SIZE = 1_000_000;
const MAX_PDF_CONCURRENCY = 1;
const CONTENT_TIMEOUT = 2 * 60 * 1000;

const MAX_JOBS_BEFORE_RESTART = 25;

const pdfLimiter = new Semaphore(MAX_PDF_CONCURRENCY);

class PuppeteerPdfService implements PdfService {
  private jobCount = 0;
  currentUserDataDir: string;

  constructor(private logger: Logger, private browser: puppeteer.Browser) {
    // Listen for crashes/disconnects
    this.browser.on('disconnected', async () => {
      this.logger.warn('Browser disconnected — restarting...');
      await this.restartBrowser();
    });
  }

  private async restartBrowser() {
    try {
      this.logger.info('Closing Browser...');
      await this.browser.close();
    } catch (e) {
      this.logger.warn(`Failed to close browser: ${e}`);
    }

    // Clean up old temp dir
    if (this.currentUserDataDir) {
      try {
        await fs.rm(this.currentUserDataDir, { recursive: true, force: true });
        this.logger.info(`🧹 Deleted old temp dir: ${this.currentUserDataDir}`);
      } catch (e) {
        this.logger.warn(`Failed to delete temp dir ${this.currentUserDataDir}: ${e}`);
      }
    }

    this.currentUserDataDir = `/tmp/chrome-${Date.now()}`;
    this.logger.info('🚀 Launching new Chromium instance...');

    this.browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 30_000,
      args: ['--disable-dev-shm-usage', '--no-sandbox', `--user-data-dir=${this.currentUserDataDir}`],
    });

    this.jobCount = 0;
    this.logger.info('✅ Chromium relaunched');
  }

  public async generatePdf(props: PdfServiceProps): Promise<Readable> {
    try {
      return await this._generatePdfOnce(props);
    } catch (err) {
      if (/Protocol error|Target closed/i.test((err as Error).message)) {
        this.logger.warn('Browser crash detected — retrying with fresh browser...');
        await this.restartBrowser();
        return await this._generatePdfOnce(props);
      }
      throw err;
    }
  }

  async _generatePdfOnce({ content, header, footer, logger }: PdfServiceProps): Promise<Readable> {
    const release = await pdfLimiter.acquire();
    let page: puppeteer.Page | null = null;
    let context: puppeteer.BrowserContext | null = null;

    try {
      this.jobCount++;
      if (this.jobCount >= MAX_JOBS_BEFORE_RESTART) {
        logger?.info(`♻ Restarting browser after ${this.jobCount} jobs...`);
        await this.restartBrowser();
      }

      logger?.info('HTML size (bytes):', Buffer.byteLength(content, 'utf8'));
      logger?.info('Starts with:', content.slice(0, 100));
      checkPDFSize(content.length, logger);

      context = await this.browser.createBrowserContext();
      logger.info('📦 Context created');

      page = await context.newPage();
      logger.info('📄 Page created');
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
      page.on('requestfailed', (req) => logger.warn(`Failed Request: ${req.url()} - ${req.failure()?.errorText}`));

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
      logger.info('📜 Content set, starting PDF...');

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
export async function createPdfService(logger: Logger, brow: puppeteer.Browser | null = null): Promise<PdfService> {
  const userDataDir = `/tmp/chrome-${Date.now()}`;
  logger.info('🚀 Launching Chromium...');
  const browser =
    brow ??
    (await puppeteer.launch({
      headless: true,
      protocolTimeout: 30_000,
      args: ['--disable-dev-shm-usage', '--no-sandbox', `--user-data-dir=${userDataDir}`],
    }));
  logger.info('✅ Chromium launched');

  const service = new PuppeteerPdfService(logger, browser);
  (service as PuppeteerPdfService).currentUserDataDir = userDataDir; // track for cleanup

  return service;
}
