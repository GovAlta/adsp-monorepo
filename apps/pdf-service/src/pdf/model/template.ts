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

  private evaluateTemplate: (context: unknown) => string;

  constructor(
    templateService: TemplateService,
    private readonly pdfService: PdfService,
    { tenantId, id, name, description, template, header, footer }: PdfTemplate
  ) {
    this.tenantId = tenantId;
    this.id = id;
    this.name = name;
    this.description = description;
    this.template = template;
    this.header = header;
    this.footer = footer;
    this.evaluateTemplate = templateService.getTemplateFunction(template);
  }

  generate(context: unknown): Promise<Buffer> {
    const content = this.evaluateTemplate(context);
    return this.pdfService.generatePdf({
      content,
      footer: this.footer,
      header: this.header,
    });
  }
}
