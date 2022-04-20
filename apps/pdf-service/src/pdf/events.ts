import { DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';
import { FileResult } from './types';

export const PDF_GENERATED = 'pdf-generated';
export const PdfGeneratedDefinition: DomainEventDefinition = {
  name: PDF_GENERATED,
  description: 'Signalled when a PDF has been generated.',
  payloadSchema: {
    type: 'object',
    properties: {
      jobId: { type: 'string' },
      file: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          urn: { type: 'string' },
          filename: { type: 'string' },
        },
      },
      generatedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

export const PDF_GENERATION_FAILED = 'pdf-generation-failed';
export const PdfGenerationFailedDefinition: DomainEventDefinition = {
  name: PDF_GENERATION_FAILED,
  description: 'Signalled when a PDF generation has failed.',
  payloadSchema: {
    type: 'object',
    properties: {
      jobId: { type: 'string' },
      generatedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

export const pdfGenerated = (
  jobId: string,
  file: FileResult,
  generatedBy: { id: string; name: string }
): DomainEvent => ({
  name: PDF_GENERATED,
  timestamp: new Date(),
  payload: {
    jobId,
    file,
    generatedBy,
  },
});

export const pdfGenerationFailed = (jobId: string, generatedBy: { id: string; name: string }): DomainEvent => ({
  name: PDF_GENERATION_FAILED,
  timestamp: new Date(),
  payload: {
    jobId,
    generatedBy,
  },
});
