import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Readable } from 'stream';
import { PdfService, PdfTemplate, TemplateService } from '../types';
import { Logger } from 'winston';

// additionalStyles is wrapped verbatim, without unwrapping a <style> element the stored value may
// already carry.
//
// That double wrapping is not accidental. Tenants authored their templates against it: the parser
// closes the style element at the first </style>, so CSS error recovery consumes the leading
// <style> token together with the first rule in the file, and the trailing </style> lands in the
// body as text. Normalizing to a single wrapper made that first rule start applying, which changed
// the layout of every already-published PDF whose CSS tab holds the ADSP default. Correct in
// isolation, but not a change to make underneath live documents.
//
// The only departure from the original is that an unset value yields no style element rather than
// <style>undefined</style>. Both render identically — `undefined` is not valid CSS and is
// discarded — so this costs nothing and keeps the literal out of the output.
//
// If the double wrapping is ever to be undone, it needs a migration that rewrites stored
// additionalStyles, not a change to how they are rendered.
export function wrapAdditionalStyles(additionalStyles?: string): string {
  const styles = additionalStyles?.trim();
  return styles ? `<style>${styles}</style>` : '';
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
