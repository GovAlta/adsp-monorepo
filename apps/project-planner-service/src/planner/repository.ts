import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { BusinessPattern, Solution, SolutionCriteria, SpecialistChat, SpecialistChatCriteria } from './types';
import { VersionContent } from './versioning';

export interface SolutionRepository {
  find(top: number, after: string, criteria: SolutionCriteria): Promise<Results<Solution>>;
  get(tenantId: AdspId, id: string): Promise<Solution | null>;
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
  findBySolution(tenantId: AdspId, solutionId: string): Promise<SpecialistChat[]>;
}

export interface SolutionVersionSummary {
  number: number;
  name: string;
  createdOn: Date;
}

export interface SolutionVersion extends SolutionVersionSummary {
  contentHash: string;
  content: VersionContent;
}

// Saved versions are immutable apart from their name; they go when the solution does.
export interface SolutionVersionRepository {
  list(tenantId: AdspId, solutionId: string): Promise<SolutionVersionSummary[]>;
  get(tenantId: AdspId, solutionId: string, number: number): Promise<SolutionVersion | null>;
  latest(tenantId: AdspId, solutionId: string): Promise<SolutionVersion | null>;
  create(tenantId: AdspId, solutionId: string, content: VersionContent): Promise<SolutionVersion>;
  rename(tenantId: AdspId, solutionId: string, number: number, name: string): Promise<SolutionVersion | null>;
}

export interface Repositories {
  isConnected: () => Promise<boolean>;
  solutionRepository: SolutionRepository;
  patternRepository: PatternRepository;
  specialistChatRepository: SpecialistChatRepository;
  solutionVersionRepository: SolutionVersionRepository;
}
