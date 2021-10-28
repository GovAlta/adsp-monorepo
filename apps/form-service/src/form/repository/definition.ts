import { AdspId } from '@abgov/adsp-service-sdk';
import { FormDefinitionEntity } from '../model';

export interface FormDefinitionRepository {
  getDefinition(tenantId: AdspId, id: string): Promise<FormDefinitionEntity>;
}
