import { AdspId } from '@abgov/adsp-service-sdk';
import { PdfService, PdfTemplate, TemplateService } from '../types';
import axios from 'axios';

export class PdfTemplateEntity implements PdfTemplate {
  tenantId: AdspId;
  id: string;
  name: string;
  description: string;
  template: string;
  templateService: TemplateService;
  header?: string;
  footer?: string;
  additionalStyles?: string;
  additionalStylesWrapped?: string;
  fileList: any;

  private evaluateTemplate: (context: unknown) => string;
  private evaluateFooterTemplate: (context: unknown) => string;
  private evaluateHeaderTemplate: (context: unknown) => string;

  constructor(
    templateService: TemplateService,
    private readonly pdfService: PdfService,
    { tenantId, id, name, description, template, header, footer, additionalStyles }: PdfTemplate
  ) {
    console.log(JSON.stringify('constructing') + '<>constructing');
    this.tenantId = tenantId;
    this.id = id;
    this.name = name;
    this.description = description;
    this.template = template;
    this.header = header;
    this.footer = footer;
    this.templateService = templateService;
    this.fileList = null;

    this.additionalStylesWrapped = '<style>' + additionalStyles + '</style>';

    const additionalStylesWrapped = '<style>' + additionalStyles + '</style>';

    // this.evaluateTemplate = this.templateService.getTemplateFunction(additionalStylesWrapped.concat(template));
    // this.evaluateFooterTemplate = this.templateService.getTemplateFunction(
    //   additionalStylesWrapped.concat(footer),
    //   'pdf-footer'
    // );
    // this.evaluateHeaderTemplate = this.templateService.getTemplateFunction(
    //   additionalStylesWrapped.concat(header),
    //   'pdf-header'
    // );
  }

  async populateFileList(token: string) {

    this.fileList = await this.templateService.populateFileList(token);
    console.log(JSON.stringify(this.fileList) + "<----this.fileList")
  }

  evaluateTemplates() {
   // console.log(JSON.stringify(token) + '<-tokentoken');
   // this.templateService.setTenantToken(token);
    this.evaluateTemplate = this.templateService.getTemplateFunction(this.additionalStylesWrapped.concat(this.template));
    this.evaluateFooterTemplate = this.templateService.getTemplateFunction(
      this.additionalStylesWrapped.concat(this.footer),
      'pdf-footer'
    );
    this.evaluateHeaderTemplate = this.templateService.getTemplateFunction(
      this.additionalStylesWrapped.concat(this.header),
      'pdf-header'
    );
  } 

  generate(context: unknown): Promise<Buffer> {
   
    

    console.log(JSON.stringify(this.templateService.getTenantToken()) + '<-getTenantToken');
    console.log(JSON.stringify(context) + '<-context');

    // const content = this.templateService.getTemplateFunction(this.additionalStylesWrapped.concat(this.template))(
    //   context
    // );
    // const footer = this.templateService.getTemplateFunction(this.additionalStylesWrapped.concat(this.template))(
    //   context
    // );
    // const header = this.templateService.getTemplateFunction(this.additionalStylesWrapped.concat(this.template))(
    //   context
    // ); 

    const content = this.evaluateTemplate(context);
    const footer = this.evaluateFooterTemplate(context);
    const header = this.evaluateHeaderTemplate(context);
    console.log(JSON.stringify(content) + '<-contentxx');
    return this.pdfService.generatePdf({
      content,
      footer,
      header,
    });
  }
}
