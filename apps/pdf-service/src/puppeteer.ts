import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { PdfService, PdfServiceProps } from './pdf';
import { Semaphore } from 'await-semaphore';
import { Logger } from 'winston';
import { promises as fs } from 'fs';

const MAX_HTML_SIZE = 5_000_000;
const WARN_HTML_SIZE = 1_000_000;
const MAX_PDF_CONCURRENCY = 1;

export const CONTENT_TIMEOUT = 2 * 60 * 1000;

const pdfLimiter = new Semaphore(MAX_PDF_CONCURRENCY);

class PuppeteerPdfService implements PdfService {
  private maxJobsBeforeRestart: number;
  jobCount = 0;
  currentUserDataDir: string;

  constructor(private logger: Logger, private browser: puppeteer.Browser, options?: { maxJobsBeforeRestart?: number }) {
    // Listen for crashes/disconnects
    this.browser.on('disconnected', async () => {
      this.logger.warn('Browser disconnected — restarting...');
      await this.restartBrowser();
    });
    this.maxJobsBeforeRestart = options?.maxJobsBeforeRestart ?? 25;
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
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        protocolTimeout: 30_000,
        args: ['--disable-dev-shm-usage', '--no-sandbox', `--user-data-dir=${this.currentUserDataDir}`],
      });
    } catch (e) {
      this.logger.error('Failed to relaunch Chromium:', e);
      throw e;
    }

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
      if (this.jobCount >= this.maxJobsBeforeRestart) {
        logger.info(`♻ Restarting browser after ${this.jobCount} jobs...`);
        await this.restartBrowser();
      }

      logger.info('HTML size (bytes):', Buffer.byteLength(content, 'utf8'));
      logger.info('Starts with:', content.slice(0, 100));
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

      try {
        await withTimeout(page.setContent(content, { timeout: 0 }), CONTENT_TIMEOUT, 'setContent hard timeout');
      } catch (err) {
        logger.error('Error setting content:', err.message);
        throw err;
      }
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
      if (page) await page.close().catch((err) => logger.error('Error closing page:', err));
      if (context) await context.close().catch((err) => logger.error('Error closing context:', err));
      release();
    }
  }
}

export async function timeIt<T>(logger: Logger, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  logger.info(`PDF generated in ${duration}ms`);
  return result;
}

export const checkPDFSize = (length: number, logger: Logger) => {
  if (length > WARN_HTML_SIZE) {
    logger.warn(`Large HTML content: ${(length / 1_000_000).toFixed(2)}MB`);
  }
  if (length > MAX_HTML_SIZE) {
    throw new Error(`HTML content is too large for PDF generation: ${(length / 1_000_000).toFixed(2)}MB`);
  }
};

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  return new Promise<T>((resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((val) => {
        clearTimeout(timeoutId);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
}

//eslint-disable-next-line
export async function createPdfService(
  logger: Logger,
  brow: puppeteer.Browser | null = null,
  maxJobsBeforeRestart: number = null
): Promise<PuppeteerPdfService> {
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

  const service = new PuppeteerPdfService(logger, browser, { maxJobsBeforeRestart: maxJobsBeforeRestart });
  (service as PuppeteerPdfService).currentUserDataDir = userDataDir; // track for cleanup

  return service;
}
