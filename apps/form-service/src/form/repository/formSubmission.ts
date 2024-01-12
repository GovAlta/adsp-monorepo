import { AdspId } from '@abgov/adsp-service-sdk';
import { OptionalResults } from '@core-services/core-common';
import { FormSubmissionEntity } from '../model';
import { FormSubmissionCriteria } from '../types';

export interface FormSubmissionRepository {
  get(tenantId: AdspId, id: string): Promise<FormSubmissionEntity>;
  getByFormIdAndSubmissionId(tenantId: AdspId, id: string, formId: string): Promise<FormSubmissionEntity>;
  find(criteria: FormSubmissionCriteria): Promise<OptionalResults<FormSubmissionEntity>>;
  save(entity: FormSubmissionEntity): Promise<FormSubmissionEntity>;
  delete(entity: FormSubmissionEntity): Promise<boolean>;
}
