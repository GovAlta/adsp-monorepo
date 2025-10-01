import { AdspId } from '@abgov/adsp-service-sdk';
import { Attachment } from './types';

export interface FileAttachmentService {
  getAttachment: (urn: AdspId) => Promise<Attachment>;
}
