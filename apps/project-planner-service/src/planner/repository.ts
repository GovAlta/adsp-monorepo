import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { BusinessPattern, Solution, SolutionCriteria, SpecialistChat, SpecialistChatCriteria } from './types';

export interface SolutionRepository {
  find(top: number, after: string, criteria: SolutionCriteria): Promise<Results<Solution>>;
  get(tenantId: AdspId, id: string): Promise<Solution | null>;
  // Optimistic concurrency: an update must carry the stored revision + 1 or the save is rejected.
  save(solution: Solution): Promise<Solution>;
  delete(tenantId: AdspId, id: string): Promise<boolean>;
}

// Tenant-specific patterns: new custom patterns, or customized copies of built-in patterns.
export interface PatternRepository {
  find(tenantId: AdspId): Promise<BusinessPattern[]>;
  save(tenantId: AdspId, pattern: BusinessPattern, user: { id: string; name: string }): Promise<BusinessPattern>;
  delete(tenantId: AdspId, id: string): Promise<boolean>;
}

// A user's saved conversations with service specialists.
export interface SpecialistChatRepository {
  find(criteria: SpecialistChatCriteria): Promise<SpecialistChat[]>;
  get(tenantId: AdspId, id: string): Promise<SpecialistChat | null>;
  save(chat: SpecialistChat): Promise<SpecialistChat>;
  delete(tenantId: AdspId, id: string): Promise<boolean>;
}
