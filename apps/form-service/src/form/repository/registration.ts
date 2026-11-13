// clean-code-ignore: RULE-19 — repository interface declaration; the mongo implementation is
// covered by ../../mongo/registration.spec.ts.
import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { FormRegistrationEntity } from '../model';
import { FormRegistrationCriteria } from '../types';

export interface FormRegistrationRepository {
  get(tenantId: AdspId, definitionId: string, id: string): Promise<FormRegistrationEntity>;
  getLatestByEmail(tenantId: AdspId, definitionId: string, email: string): Promise<FormRegistrationEntity>;
  find(top: number, after: string, criteria: FormRegistrationCriteria): Promise<Results<FormRegistrationEntity>>;
  create(entity: FormRegistrationEntity): Promise<FormRegistrationEntity>;
  // Applies the review only if the stored registration is still pending; resolves null otherwise.
  updateIfPending(entity: FormRegistrationEntity): Promise<FormRegistrationEntity>;
}
