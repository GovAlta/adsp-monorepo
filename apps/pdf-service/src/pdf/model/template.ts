import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Readable } from 'stream';
import { PdfService, PdfTemplate, TemplateService } from '../types';
import { Logger } from 'winston';

export class PdfTemplateEntity implements PdfTemplate {
  tenantId: AdspId;
  id: string;
  name: string;
  description: string;
  template: string;
  templateService: TemplateService;
  tokenProvider: TokenProvider;
  directory: ServiceDirectory;
  header?: string;
  footer?: string;
  additionalStyles?: string;
  startWithDefault?: boolean;
  additionalStylesWrapped?: string;
  logger: Logger;

  private evaluateTemplate: (context: unknown) => string;
  private evaluateFooterTemplate: (context: unknown) => string;
  private evaluateHeaderTemplate: (context: unknown) => string;

  constructor(
    templateService: TemplateService,
    private readonly pdfService: PdfService,
    {
      tenantId,
      id,
      name,
      description,
      template,
      header,
      footer,
      additionalStyles,
      startWithDefault,
      logger,
    }: PdfTemplate
  ) {
    this.tenantId = tenantId;
    this.id = id;
    this.name = name;
    this.description = description;
    this.template = template;
    this.header = header;
    this.footer = footer;
    this.templateService = templateService;
    this.startWithDefault = startWithDefault;

    this.additionalStylesWrapped = '<style>' + additionalStyles + '</style>';
    this.logger = logger;
  }

  private initializeTemplates() {
    // Lazy initialize; no need to re-initialize unless templates change (i.e. configuration update).
    if (!this.evaluateTemplate) {
      this.evaluateTemplate = this.templateService.getTemplateFunction(
        this.additionalStylesWrapped.concat(this.template),
        null
      );
      this.evaluateFooterTemplate = this.templateService.getTemplateFunction(
        this.footer ? this.additionalStylesWrapped.concat(this.footer) : this.footer,
        'pdf-footer'
      );
      this.evaluateHeaderTemplate = this.templateService.getTemplateFunction(
        this.header ? this.additionalStylesWrapped.concat(this.header) : this.header,
        'pdf-header'
      );
    }
  }

  generate(context: unknown): Promise<Readable> {
    this.initializeTemplates();

    const content = this.evaluateTemplate(context);
    const footer = this.evaluateFooterTemplate(context);
    const header = this.evaluateHeaderTemplate(context);
    const logger = this.logger;

    return this.pdfService.generatePdf({
      content,
      footer,
      header,
      logger,
    });
  }
}
