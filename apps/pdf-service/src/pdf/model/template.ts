import { AdspId } from '@abgov/adsp-service-sdk';
import { PdfService, PdfTemplate, TemplateService } from '../types';

export class PdfTemplateEntity implements PdfTemplate {
  tenantId: AdspId;
  id: string;
  name: string;
  description: string;
  template: string;
  header?: string;
  footer?: string;
  css?: string;

  private evaluateTemplate: (context: unknown) => string;
  private evaluateFooterTemplate: (context: unknown) => string;
  private evaluateHeaderTemplate: (context: unknown) => string;

  constructor(
    templateService: TemplateService,
    private readonly pdfService: PdfService,
    { tenantId, id, name, description, template, header, footer, css }: PdfTemplate
  ) {
    this.tenantId = tenantId;
    this.id = id;
    this.name = name;
    this.description = description;
    this.template = template;
    this.header = header;
    this.footer = footer;
    this.additionalStyles = additionalStyles;
    this.evaluateTemplate = templateService.getTemplateFunction(template);
    this.evaluateFooterTemplate = templateService.getTemplateFunction(footer, 'pdf-footer');
    this.evaluateHeaderTemplate = templateService.getTemplateFunction(header, 'pdf-header');
  }

  generate(context: unknown): Promise<Buffer> {
    const content = this.evaluateTemplate(context);
    const footer = this.evaluateFooterTemplate(context);
    const header = this.evaluateHeaderTemplate(context);
    return this.pdfService.generatePdf({
      content,
      footer,
      header,
    });
  }
}
