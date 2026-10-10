import { AdspId } from '@abgov/adsp-service-sdk';

export const CONCEPT_TYPES = [
  'actor',
  'goal',
  'activity',
  'decision',
  'evidence',
  'business-rule',
  'constraint',
  'evaluation-criterion',
  'workflow',
  'outcome',
  'document',
  'event',
  'external-system',
  'assumption',
  'unknown',
] as const;
export type ConceptType = (typeof CONCEPT_TYPES)[number];

export type SolutionStatus = 'draft' | 'analyzed' | 'in-progress' | 'completed' | 'archived';
export type ConceptSource = 'user' | 'extracted' | 'pattern' | 'assumed';

export interface BusinessConcept {
  id: string;
  type: ConceptType;
  name: string;
  description?: string;
  source: ConceptSource;
  confidence?: number;
}

export interface DecisionRecord {
  id: string;
  title: string;
  decision: string;
  // Why the decision was made; persisted so users are not asked to repeat reasoning.
  reason: string;
  decidedOn: string;
  decidedBy?: string;
}

export interface OpenQuestion {
  id: string;
  question: string;
  // Pattern or specialist that raised the question.
  raisedBy: string;
  status: 'open' | 'answered';
  answer?: string;
}

export interface Signal {
  description: string;
  keywords: string[];
}

export interface ServiceMapping {
  service: string;
  reason: string;
}

export interface BusinessPattern {
  id: string;
  name: string;
  description: string;
  domainLanguage: string[];
  strongSignals: Signal[];
  weakSignals: Signal[];
  serviceMappings: ServiceMapping[];
  clarifyingQuestions: string[];
  assumptions: string[];
  knownUnknowns: string[];
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface PatternMatch {
  patternId: string;
  patternName: string;
  score: number;
  level: ConfidenceLevel;
  matchedLanguage: string[];
  matchedSignals: string[];
  explanation: string;
}

export interface ServiceRecommendation {
  service: string;
  reason: string;
  order: number;
}

export interface Hypothesis {
  id: string;
  title: string;
  patternId: string;
  confidence: ConfidenceLevel;
  rationale: string;
  recommendations: ServiceRecommendation[];
  assumptions: string[];
  unknowns: string[];
}

export type SpecialistStatus = 'not-started' | 'consulted' | 'in-workspace' | 'completed';

export interface SpecialistProgress {
  service: string;
  status: SpecialistStatus;
  notes?: string;
  updatedOn: string;
}

export interface SolutionArtifact {
  id: string;
  service: string;
  name: string;
  urn?: string;
  createdOn: string;
}

export interface NextStep {
  title: string;
  service?: string;
  reason: string;
}

export interface SolutionState {
  problemStatement: string;
  concepts: BusinessConcept[];
  decisions: DecisionRecord[];
  questions: OpenQuestion[];
  patternMatches: PatternMatch[];
  hypotheses: Hypothesis[];
  specialists: SpecialistProgress[];
  artifacts: SolutionArtifact[];
  nextSteps: NextStep[];
}

export interface Solution {
  id: string;
  tenantId: AdspId;
  name: string;
  description?: string;
  scenario: string;
  status: SolutionStatus;
  createdById: string;
  createdByName: string;
  createdOn: Date;
  updatedOn: Date;
  revision: number;
  state: SolutionState;
}

export interface SolutionCriteria {
  tenantId: AdspId;
  createdById?: string;
  status?: SolutionStatus;
}

export interface SpecialistDefinition {
  service: string;
  displayName: string;
  purpose: string;
  workspacePath: string;
  questions: string[];
  dependsOn: string[];
  risks: string[];
  order: number;
}

export interface PlannerConfiguration {
  patterns?: Record<string, BusinessPattern>;
}
