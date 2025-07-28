import { adspId } from '@abgov/adsp-service-sdk';
import { PdfTemplateEntity } from './template';
import { Logger } from 'winston';

describe('PdfTemplateEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const templateServiceMock = {
    getTemplateFunction: jest.fn(),
  };

  const loggerMock = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  } as unknown as Logger;

  const pdfServiceMock = {
    generatePdf: jest.fn(),
  };
  it('can create entity', () => {
    const entity = new PdfTemplateEntity(templateServiceMock, pdfServiceMock, {
      tenantId,
      id: 'test-template',
      name: 'Test Template',
      description: null,
      template: 'template',
      logger: loggerMock,
    });
    expect(entity).toBeTruthy();
  });

  it('can generate', async () => {
    const template = jest.fn(() => 'evaluated');
    templateServiceMock.getTemplateFunction
      .mockReturnValueOnce(template)
      .mockReturnValueOnce(template)
      .mockReturnValueOnce(template);

    const entity = new PdfTemplateEntity(templateServiceMock, pdfServiceMock, {
      tenantId,
      id: 'test-template',
      name: 'Test Template',
      description: null,
      template: 'template',
      logger: loggerMock,
    });

    const context = {};
    const stream = {};
    pdfServiceMock.generatePdf.mockResolvedValueOnce(stream);
    const result = await entity.generate(context);
    expect(template).toHaveBeenCalledWith(context);
    expect(pdfServiceMock.generatePdf).toHaveBeenCalledWith({
      content: 'evaluated',
      footer: 'evaluated',
      header: 'evaluated',
      logger: loggerMock,
    });
    expect(result).toBe(stream);
  });

  it('can generate with footer and header', async () => {
    const template = jest.fn(() => 'evaluated');
    templateServiceMock.getTemplateFunction
      .mockReturnValueOnce(template)
      .mockReturnValueOnce(template)
      .mockReturnValueOnce(template);

    const entity = new PdfTemplateEntity(templateServiceMock, pdfServiceMock, {
      tenantId,
      id: 'test-template',
      name: 'Test Template',
      description: null,
      template: 'template',
      footer: 'footer',
      header: 'header',
      logger: loggerMock,
    });

    const context = {};
    const stream = {};
    pdfServiceMock.generatePdf.mockResolvedValueOnce(stream);
    const result = await entity.generate(context);
    expect(template).toHaveBeenCalledWith(context);
    expect(pdfServiceMock.generatePdf).toHaveBeenCalledWith({
      content: 'evaluated',
      footer: 'evaluated',
      header: 'evaluated',
      logger: loggerMock,
    });
    expect(result).toBe(stream);
  });

  it('can create entity with header and footer', async () => {
    const entity = new PdfTemplateEntity(templateServiceMock, pdfServiceMock, {
      tenantId,
      id: 'test-template',
      name: 'Test Template',
      description: null,
      template: 'template',
      footer: 'footer',
      header: 'header',
      logger: loggerMock,
    });
    expect(entity).toBeTruthy();
  });
});
