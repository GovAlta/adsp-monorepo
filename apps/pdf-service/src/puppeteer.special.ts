// import * as puppeteer from 'puppeteer';
// import { checkPDFSize, createPdfService } from './puppeteer';
// import { Logger } from 'winston';
// import { EventEmitter } from 'events';
// import { promises as fs } from 'fs';

// jest.mock('puppeteer');
// const puppeteerMock = puppeteer as jest.Mocked<typeof puppeteer>;

// const loggerMock = {
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
//   debug: jest.fn(),
//   log: jest.fn(),
// } as unknown as Logger;

// jest.mock('fs', () => {
//   const originalFs = jest.requireActual('fs');
//   return {
//     ...originalFs,
//     promises: {
//       ...originalFs.promises,
//       rm: jest.fn(),
//     },
//   };
// });

// const browserEmitter = new EventEmitter();

// const pageMock = {
//   setJavaScriptEnabled: jest.fn().mockResolvedValue(undefined),
//   setRequestInterception: jest.fn().mockResolvedValue(undefined),
//   setContent: jest.fn().mockResolvedValue(undefined),
//   pdf: jest.fn().mockResolvedValue(Buffer.from('result')),
//   close: jest.fn().mockResolvedValue(undefined),
//   on: jest.fn(),
// };

// const contextMock = {
//   newPage: jest.fn().mockResolvedValue(pageMock),
//   close: jest.fn().mockResolvedValue(undefined),
// };
// const browserMock = {
//   newPage: jest.fn().mockResolvedValue(pageMock),
//   createBrowserContext: jest.fn().mockResolvedValue(contextMock),
//   on: browserEmitter.on.bind(browserEmitter),
//   once: browserEmitter.once.bind(browserEmitter),
//   off: browserEmitter.off.bind(browserEmitter),
//   removeListener: browserEmitter.removeListener.bind(browserEmitter),
// } as unknown as jest.Mocked<puppeteer.Browser>;

// describe('puppeteer', () => {
//   beforeAll(() => {
//     puppeteerMock.launch.mockResolvedValue(browserMock as unknown as puppeteer.Browser);
//   });

//   beforeEach(() => {
//     puppeteerMock.launch.mockClear();
//   });

//   it('can create pdf service', async () => {
//     const service = await createPdfService(loggerMock, browserMock);
//     expect(service).toBeTruthy();
//   });

//   describe('PuppeteerPdfService', () => {
//     it('can generate pdf without footer and header', async () => {
//       const service = await createPdfService(loggerMock, browserMock);
//       const template = {
//         content: `<!doctype html>
//         <html lang=en>
//         <head>
//         <meta charset=utf-8>
//         <title>This is a title.</title>
//         </head>
//         <body>
//         <p>I'm the content</p>
//         </body>
//         </html>`,
//       };

//       contextMock.newPage.mockResolvedValueOnce(pageMock);
//       const result = await service.generatePdf({ ...template, logger: loggerMock });
//       expect(result).toBeTruthy();
//       expect(pageMock.pdf).toHaveBeenCalled();
//       expect(pageMock.close).toHaveBeenCalled();
//     });

//     it('can generate pdf wit footer and header', async () => {
//       const service = await createPdfService(loggerMock, browserMock);
//       const template = {
//         content: `<!doctype html>
//         <html lang=en>
//         <head>
//         <meta charset=utf-8>
//         <title>This is a title.</title>
//         </head>
//         <body>
//         <p>I'm the content</p>
//         </body>
//         </html>
//         `,
//         footer: `
//         <div>
//           <p>
//             footer
//           </p>
//         </div>`,
//         header: `
//           <div>
//             <p>
//               header
//             </p>
//           </div>`,
//       };

//       contextMock.newPage.mockResolvedValueOnce(pageMock);
//       const result = await service.generatePdf({ ...template, logger: loggerMock });
//       expect(result).toBeTruthy();
//       expect(pageMock.pdf).toHaveBeenCalledWith(
//         expect.objectContaining({
//           headerTemplate: template.header,
//           footerTemplate: template.footer,
//           displayHeaderFooter: true,
//         })
//       );
//       expect(pageMock.close).toHaveBeenCalled();
//     });

//     it('can handle partial header footer', async () => {
//       const service = await createPdfService(loggerMock, browserMock);
//       const template = {
//         content: `<!doctype html>
//         <html lang=en>
//         <head>
//         <meta charset=utf-8>
//         <title>This is a title.</title>
//         </head>
//         <body>
//         <p>I'm the content</p>
//         </body>
//         </html>`,
//         footer: `
//         <div>
//           <p>
//             footer
//           </p>
//         </div>`,
//       };

//       contextMock.newPage.mockResolvedValueOnce(pageMock);
//       const result = await service.generatePdf({ ...template, logger: loggerMock });
//       expect(result).toBeTruthy();
//       expect(pageMock.pdf).toHaveBeenCalledWith(
//         expect.objectContaining({
//           headerTemplate: '',
//           footerTemplate: template.footer,
//           displayHeaderFooter: true,
//         })
//       );
//       expect(pageMock.close).toHaveBeenCalled();
//     });

//     it('will warn when content is large', async () => {
//       checkPDFSize(1_000_001, loggerMock);
//       expect(loggerMock.warn).toHaveBeenCalledWith('Large HTML content: 1.00MB');
//     });

//     it('will throw when content is too large', () => {
//       expect(() => checkPDFSize(10_000_001, loggerMock)).toThrow(
//         'HTML content is too large for PDF generation: 10.00MB'
//       );
//     });
//   });
// });

// describe('PuppeteerPdfService restartBrowser', () => {
//   let service: any; // your PuppeteerPdfService instance

//   beforeEach(async () => {
//     // create service instance however you do it
//     service = await createPdfService(loggerMock, browserMock);
//   });

//   beforeEach(() => {
//   jest.clearAllMocks();
// });

//   it('restarts browser successfully', async () => {
//     service.currentUserDataDir = '/tmp/old-dir';
//     (fs.rm as jest.Mock).mockResolvedValue(undefined);
//     service.browser.close = jest.fn().mockResolvedValue(undefined);
//     puppeteerMock.launch.mockResolvedValue(browserMock);

//     await service.restartBrowser();

//     expect(service.browser.close).toHaveBeenCalled();
//     expect(fs.rm).toHaveBeenCalledWith('/tmp/old-dir', { recursive: true, force: true });
//     expect(puppeteerMock.launch).toHaveBeenCalledWith(
//       expect.objectContaining({
//         args: expect.arrayContaining([expect.stringContaining(service.currentUserDataDir)]),
//       })
//     );
//     expect(service.jobCount).toBe(0);
//     expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Closing Browser...'));
//     expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Launching new Chromium instance'));
//     expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Chromium relaunched'));
//   });

//   it('handles error when closing browser and deleting temp dir', async () => {
//     service.currentUserDataDir = '/tmp/old-dir';
//     service.browser.close = jest.fn().mockRejectedValue(new Error('close failed'));
//     (fs.rm as jest.Mock).mockRejectedValue(new Error('rm failed'));
//     puppeteerMock.launch.mockResolvedValue(browserMock);

//     await service.restartBrowser();

//     expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to close browser'));
//     expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to delete temp dir'));
//   });

//   it('skips deleting temp dir if none', async () => {
//     service.currentUserDataDir = null;
//     service.browser.close = jest.fn().mockResolvedValue(undefined);
//     puppeteerMock.launch.mockResolvedValue(browserMock);

//     await service.restartBrowser();

//     expect(fs.rm).not.toHaveBeenCalled();
//   });
// });
