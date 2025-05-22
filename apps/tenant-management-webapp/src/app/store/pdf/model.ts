import { defaultTemplateBody } from '../../store/pdf/defaultTemplates/body';
import { defaultTemplateHeader } from '../../store/pdf/defaultTemplates/header';
import { defaultTemplateFooter } from '../../store/pdf/defaultTemplates/footer';
import { defaultTemplateCss } from '../../store/pdf/defaultTemplates/css';
import { defaultAssignments } from '../../store/pdf/defaultTemplates/assignments';
import { FileItem } from '@store/file/models';
import { FormDefinition } from '@store/form/model';
export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  header: string;
  additionalStyles: string;
  footer: string;
  variables?: string;
  startWithDefault?: boolean;
}

export interface PdfGenerationResponse {
  id: string;
  status: string;
  templateId: string;
  filename: string;
  result: {
    urn: string;
    id: string;
  };
  context?: {
    jobId?: string;
    templateId?: string;
  };
  payload?: {
    file?: {
      id?: string;
    };
    error?: string;
  };
  //eslint-disable-next-line
  data: any;
  //eslint-disable-next-line
  stream: any;
  name?: string;
  fileWasGenerated: boolean;
}

export interface UpdatePDFResponse {
  fileList: FileItem[];
}

export interface PdfGenerationPayload {
  templateId: string;
  data: { definition: FormDefinition; content?: Record<string, unknown> };
  fileName: string;
  inputData?: Record<string, SchemaType>;
}

export type SchemaType = {
  config: Record<string, unknown>;
  data: Record<string, unknown>;
};

export interface PdfMetrics {
  pdfGenerated?: number;
  pdfFailed?: number;
  generationDuration?: number;
}

interface Stream {
  namespace: string;
  name: string;
  correlationId: string;
  context: {
    jobId: string;
    templateId: string;
  };
  timestamp: string;
  payload: {
    jobId: string;
    templateId: string;
    file?: {
      urn: string;
      id: string;
      filename: string;
    };
    error?: string;
    requestedBy: {
      id: string;
      name: string;
    };
  };
}

export interface PdfState {
  pdfTemplates: Record<string, PdfTemplate>;
  corePdfTemplates: Record<string, PdfTemplate>;
  metrics: PdfMetrics;
  stream: Stream[];
  jobs: PdfGenerationResponse[];
  reloadFile: Record<string, string>;
  status: string[];
  files: Record<string, Blob>;
  currentFile: Blob;
  currentId: string;
  socketChannel: boolean;
  tempTemplate: PdfTemplate;
  openEditor: string;
}

export const defaultPdfTemplate: PdfTemplate = {
  id: '',
  name: '',
  description: '',
  template: defaultTemplateBody,
  startWithDefault: true,
  additionalStyles: defaultTemplateCss,
  header: defaultTemplateHeader,
  footer: defaultTemplateFooter,
  variables: defaultAssignments,
};

export interface UpdatePdfConfig {
  operation: string;
  update: Record<string, PdfTemplate>;
}
export interface DeletePdfConfig {
  operation: string;
  property: string;
}

export interface CreatePdfConfig {
  operation: string;
  templateId: string;
  // eslint-disable-next-line
  data: Record<string, any>;
  filename: string;
}
