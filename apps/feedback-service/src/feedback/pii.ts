import { AdspId } from '@abgov/adsp-service-sdk';

export interface PiiService {
  anonymize(tenantId: AdspId, text: string): Promise<string>;
}
