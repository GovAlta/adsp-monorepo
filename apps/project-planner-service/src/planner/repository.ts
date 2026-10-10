import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { Solution, SolutionCriteria } from './types';

export interface SolutionRepository {
  find(top: number, after: string, criteria: SolutionCriteria): Promise<Results<Solution>>;
  get(tenantId: AdspId, id: string): Promise<Solution | null>;
  // Optimistic concurrency: an update must carry the stored revision + 1 or the save is rejected.
  save(solution: Solution): Promise<Solution>;
  delete(tenantId: AdspId, id: string): Promise<boolean>;
}
