import { AdspId } from '@abgov/adsp-service-sdk';
import { FileResult, PdfJob, PdfJobStatus } from '../types';

export interface PdfJobRepository {
  create(tenantId: AdspId): Promise<PdfJob>;
  get(jobId: string): Promise<PdfJob>;
  update(jobId: string, status: PdfJobStatus, result?: FileResult): Promise<PdfJob>;
}
