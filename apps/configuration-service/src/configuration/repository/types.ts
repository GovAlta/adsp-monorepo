// clean-code-ignore: RULE-19
import { AdspId } from '@abgov/adsp-service-sdk';

export interface ConfigurationEntityCriteria {
  namespaceEquals?: string;
  nameContains?: string;
  tenantIdEquals?: AdspId;
  registeredIdEquals?: string;
  useOr?: boolean;
  createDateAfter?: Date; // clean-code-ignore: 2.9 — name matches form-admin-app API contract
  createDateBefore?: Date; // clean-code-ignore: 2.9 — name matches form-admin-app API contract
  [key: string]: unknown;
}
