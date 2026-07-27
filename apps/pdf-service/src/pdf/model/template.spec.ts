import { adspId } from '@abgov/adsp-service-sdk';
import { PdfTemplateEntity, wrapAdditionalStyles } from './template';
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

  it('retains additionalStyles so it can be read back from configuration', () => {
    const entity = new PdfTemplateEntity(templateServiceMock, pdfServiceMock, {
      tenantId,
      id: 'test-template',
      name: 'Test Template',
      description: null,
      template: 'template',
      additionalStyles: '.pb20 { padding-bottom: 20px; }',
      logger: loggerMock,
    });

    expect(entity.additionalStyles).toBe('.pb20 { padding-bottom: 20px; }');
  });

  it('wraps additionalStyles in a single style element when generating', () => {
    const entity = new PdfTemplateEntity(templateServiceMock, pdfServiceMock, {
      tenantId,
      id: 'test-template',
      name: 'Test Template',
      description: null,
      template: 'template',
      additionalStyles: '.pb20 { padding-bottom: 20px; }',
      logger: loggerMock,
    });

    expect(entity.additionalStylesWrapped).toBe('<style>.pb20 { padding-bottom: 20px; }</style>');
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

  describe('wrapAdditionalStyles', () => {
    it('wraps raw css', () => {
      expect(wrapAdditionalStyles('.a { color: red; }')).toBe('<style>.a { color: red; }</style>');
    });

    it('does not double wrap css that already carries a style element', () => {
      expect(wrapAdditionalStyles('<style>\n.a { color: red; }\n</style>')).toBe(
        '<style>\n.a { color: red; }\n</style>',
      );
    });

    it('wraps css that only partially resembles a style element', () => {
      // Only a wrapper spanning the whole value is unwrapped; anything else is passed through
      // as-is rather than guessing where the author meant the css to end.
      expect(wrapAdditionalStyles('<style>.a { color: red; }</style>.b { color: blue; }')).toBe(
        '<style><style>.a { color: red; }</style>.b { color: blue; }</style>',
      );
    });

    it.each([undefined, null, '', '   '])('returns no style element for %p', (styles) => {
      expect(wrapAdditionalStyles(styles)).toBe('');
    });
  });
});
