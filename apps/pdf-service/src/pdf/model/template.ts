import { AdspId } from '@abgov/adsp-service-sdk';
import { Readable } from 'stream';
import { PdfService, PdfTemplate, TemplateService } from '../types';

export class PdfTemplateEntity implements PdfTemplate {
  tenantId: AdspId;
  id: string;
  name: string;
  description: string;
  template: string;

  private evaluateTemplate: (context: unknown) => string;

  constructor(
    templateService: TemplateService,
    private readonly pdfService: PdfService,
    { tenantId, id, name, description, template }: PdfTemplate
  ) {
    this.tenantId = tenantId;
    this.id = id;
    this.name = name;
    this.description = description;
    this.template = template;
    this.evaluateTemplate = templateService.getTemplateFunction(template);
  }

  generate(context: unknown): Promise<Readable> {
    const content = this.evaluateTemplate(context);
    return this.pdfService.generatePdf(content);
  }
}
