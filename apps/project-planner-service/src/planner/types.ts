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

export interface NotCoveredItem {
  requirement: string;
  reason: string;
  suggestedApproach: string;
}

export interface PatternUnsupportedCapability extends NotCoveredItem {
  keywords?: string[];
  category?: string;
  feeType?: string;
  recordType?: string;
}

// built-in: shipped with the service; customized: a built-in overridden by the tenant; custom: created by the tenant.
export type PatternSource = 'built-in' | 'customized' | 'custom';

export interface BusinessPattern {
  id: string;
  source?: PatternSource;
  name: string;
  description: string;
  domainLanguage: string[];
  commonFeatures: string[];
  strongSignals: Signal[];
  weakSignals: Signal[];
  serviceMappings: ServiceMapping[];
  clarifyingQuestions: string[];
  assumptions: string[];
  knownUnknowns: string[];
  unsupportedCapabilities?: PatternUnsupportedCapability[];
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

export interface NextStep {
  title: string;
  service?: string;
  reason: string;
}

export type AnalysisMode = 'ai' | 'rules';

export interface AnalysisInfo {
  mode: AnalysisMode;
  model?: string;
  // Set when AI analysis was requested but the rule-based fallback produced the result.
  warning?: string;
  analyzedOn: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

// One dimension of understanding the planner needs before proposing a solution.
export interface ConfidenceFactor {
  id: string;
  label: string;
  // 0-100: how well the conversation so far defines this dimension.
  score: number;
  note?: string;
}

// AI-led discovery: the planner asks clarifying questions until confidence passes the threshold.
export interface DiscoveryState {
  messages: ConversationMessage[];
  // 0-100, the average of the factor scores.
  confidence: number;
  threshold: number;
  factors: ConfidenceFactor[];
  // True once confidence reached the threshold (or the user asked to proceed) and a solution was presented.
  ready: boolean;
  mode: AnalysisMode;
  model?: string;
  warning?: string;
  updatedOn: string;
}

export interface BlueprintLayer {
  name: string;
  description: string;
  components: string[];
}

export interface BlueprintServiceRole {
  order: number;
  service: string;
  displayName: string;
  role: string;
  reason: string;
  dependsOn: string[];
  capabilities: string[];
}

// Consolidated guidance from one specialist: a saved consultation when one exists, otherwise a fresh one.
export interface SpecialistNote {
  service: string;
  displayName: string;
  fit: 'recommended' | 'optional' | 'not-indicated';
  source: 'saved-consultation' | 'ai' | 'rules';
  summary: string;
  supports: string[];
  constraints: string[];
  questions: string[];
  risks: string[];
  validation?: { verdict: string; findings: string[] };
  chatHighlights: string[];
  consultedOn: string;
}

export interface BlueprintWorkflow {
  name: string;
  actors: string[];
  steps: string[];
}

// adsp: tenant configuration; keycloak and openshift: set up by the team outside ADSP.
export type ComponentTarget = 'adsp' | 'keycloak' | 'openshift'; // clean-code-ignore: RULE-19 — types only; no runtime code to test.

// The user's call on whether the solution needs a component; rejected components are left out of the export.
export type ComponentReview = 'not-reviewed' | 'approved' | 'rejected';

// A concrete thing to create or configure so the solution can run.
export interface BlueprintComponent {
  order: number;
  service: string;
  type: string;
  name: string;
  purpose: string;
  dependsOn: string[];
  openDecisions: string[];
  target: ComponentTarget;
  setup: { where: string; docs: string; schemaKey?: string; how: string };
  review?: ComponentReview;
}

// The complete plan behind a proposed solution.
export interface SolutionBlueprint {
  generatedOn: string;
  mode: AnalysisMode;
  model?: string;
  warning?: string;
  overview: {
    title: string;
    summary: string;
    objectives: string[];
    scope: string[];
    outOfScope: string[];
    stakeholders: string[];
    successMeasures: string[];
    risks: string[];
  };
  architecture: {
    summary: string;
    layers: BlueprintLayer[];
    integrations: string[];
    security: string[];
    diagram: string;
  };
  serviceMapping: BlueprintServiceRole[];
  notCoveredByAdsp?: NotCoveredItem[];
  specialistNotes: SpecialistNote[];
  components: BlueprintComponent[];
  workflows: BlueprintWorkflow[];
  dataGovernance: {
    dataEntities: string[];
    accessControl: string[];
    retention: string[];
    privacy: string[];
    audit: string[];
    compliance: string[];
  };
  delivery: {
    phases: { name: string; items: string[] }[];
    nonFunctional: string[];
    openQuestions: string[];
  };
}

export interface SolutionState {
  problemStatement: string;
  concepts: BusinessConcept[];
  decisions: DecisionRecord[];
  questions: OpenQuestion[];
  patternMatches: PatternMatch[];
  hypotheses: Hypothesis[];
  specialists: SpecialistProgress[];
  nextSteps: NextStep[];
  analysis?: AnalysisInfo;
  conversation?: ConversationMessage[];
  discovery?: DiscoveryState;
  blueprint?: SolutionBlueprint;
  // Overall understanding of the problem, shown for every solution regardless of mode.
  confidence?: { score: number; threshold: number; factors: ConfidenceFactor[] };
  problemStatementUpdatedOn?: string;
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
  version: string;
  versionHistory: SolutionVersionEntry[];
  lastExportHashes: Record<string, string>;
  exportedOnce: boolean;
  state: SolutionState;
}

export interface SolutionVersionEntry {
  version: string;
  changedAt: string;
  changedBy: string;
  changedSections: string[];
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

export interface StoredChatMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
  // User messages: the task requested. Assistant messages: how the reply was produced.
  intent?: string;
  mode?: AnalysisMode;
  model?: string;
  warning?: string;
  suggestions?: string[];
  samples?: { language: string; title: string; code: string }[];
  validation?: { verdict: string; findings: string[] };
  followUps?: string[];
  // Present when the message records a planner consultation about a solution.
  consult?: Record<string, unknown>;
}

export interface SpecialistChat {
  id: string;
  tenantId: AdspId;
  service: string;
  solutionId?: string;
  title: string;
  createdById: string;
  createdByName: string;
  createdOn: Date;
  updatedOn: Date;
  messages: StoredChatMessage[];
}

export interface SpecialistChatCriteria {
  tenantId: AdspId;
  createdById: string;
  service?: string;
  solutionId?: string;
}

export interface PlannerConfiguration {
  patterns?: Record<string, BusinessPattern>;
}
