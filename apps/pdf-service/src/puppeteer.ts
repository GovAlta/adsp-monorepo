import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { PdfService, PdfServiceProps } from './pdf';


class PuppeteerPdfService implements PdfService {
  constructor(private browser: puppeteer.Browser) {}

  async generatePdf({ content, header, footer }: PdfServiceProps): Promise<Readable> {
    let page: puppeteer.Page;
    let context: puppeteer.BrowserContext | null = null;
    try {

      context = await this.browser.createBrowserContext();
      page = await context.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setContent(content, {
        waitUntil: ['domcontentloaded', 'networkidle2'],
        timeout: 2 * 60 * 1000,
      });



      let result: Buffer;
      if (header || footer) {
        const headerTemplate = !header ? '' : header;
        const footerTemplate = !footer ? '' : footer;

        result = Buffer.from(
          await page.pdf({
            headerTemplate,
            footerTemplate,
            printBackground: true,
            displayHeaderFooter: true,
            omitBackground: true,
          })
        );
      } else {
        result = Buffer.from(await page.pdf({ printBackground: true, omitBackground: true }));
      }

      return Readable.from(result);
    } finally {
      if (page) {
        await page.close();
         if (context) await context.close();
      }
    }
  }
}

//eslint-disable-next-line
export async function createPdfService(brow: any | null = null): Promise<PdfService> {
  const browser =
    (await puppeteer.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] })) || brow;
  return new PuppeteerPdfService(browser);
}
