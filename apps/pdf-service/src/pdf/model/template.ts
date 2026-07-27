import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Readable } from 'stream';
import { PdfService, PdfTemplate, TemplateService } from '../types';
import { Logger } from 'winston';

const STYLE_ELEMENT = /^\s*<style[^>]*>([\s\S]*)<\/style>\s*$/i;

// additionalStyles is stored as raw CSS, but templates seeded from the ADSP defaults were saved
// with their own <style> wrapper. Wrapping those again yields <style><style>…</style></style>: the
// parser closes the style element at the first </style>, so the CSS text starts with a literal
// <style> token, and CSS error recovery consumes it — along with the first rule in the file.
// Normalize to exactly one wrapper, and to no style element at all when there are no styles.
export function wrapAdditionalStyles(additionalStyles?: string): string {
  const styles = additionalStyles?.trim();
  if (!styles) {
    return '';
  }

  const alreadyWrapped = STYLE_ELEMENT.exec(styles);
  return `<style>${alreadyWrapped ? alreadyWrapped[1] : styles}</style>`;
}

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
  variables?: string;
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
      variables,
      startWithDefault,
      logger,
    }: PdfTemplate,
  ) {
    this.tenantId = tenantId;
    this.id = id;
    this.name = name;
    this.description = description;
    this.template = template;
    this.header = header;
    this.footer = footer;
    this.variables = variables;
    this.templateService = templateService;
    this.startWithDefault = startWithDefault;

    this.additionalStyles = additionalStyles;
    this.additionalStylesWrapped = wrapAdditionalStyles(additionalStyles);
    this.logger = logger;
  }

  private initializeTemplates() {
    // Lazy initialize; no need to re-initialize unless templates change (i.e. configuration update).
    if (!this.evaluateTemplate) {
      this.evaluateTemplate = this.templateService.getTemplateFunction(
        this.additionalStylesWrapped.concat(this.template),
        null,
      );
      this.evaluateFooterTemplate = this.templateService.getTemplateFunction(
        this.footer ? this.additionalStylesWrapped.concat(this.footer) : this.footer,
        'pdf-footer',
      );
      this.evaluateHeaderTemplate = this.templateService.getTemplateFunction(
        this.header ? this.additionalStylesWrapped.concat(this.header) : this.header,
        'pdf-header',
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
