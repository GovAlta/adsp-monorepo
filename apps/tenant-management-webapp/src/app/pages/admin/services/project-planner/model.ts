export interface BusinessConcept {
  id: string;
  type: string;
  name: string;
  description?: string;
  source: string;
  confidence?: number;
}

export interface DecisionRecord {
  id: string;
  title: string;
  decision: string;
  reason: string;
  decidedOn: string;
  decidedBy?: string;
}

export interface OpenQuestion {
  id: string;
  question: string;
  raisedBy: string;
  status: 'open' | 'answered';
  answer?: string;
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
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  recommendations: ServiceRecommendation[];
  assumptions: string[];
  unknowns: string[];
}

export interface SpecialistProgress {
  service: string;
  status: 'not-started' | 'consulted' | 'in-workspace' | 'completed';
  notes?: string;
  updatedOn: string;
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
  patternMatches?: PatternMatch[];
  hypotheses: Hypothesis[];
  specialists: SpecialistProgress[];
  artifacts?: SolutionArtifact[];
  nextSteps: NextStep[];
  analysis?: AnalysisInfo;
  conversation?: ConversationMessage[];
  discovery?: DiscoveryState;
  blueprint?: SolutionBlueprint;
  confidence?: SolutionConfidence;
}

export interface Solution {
  id: string;
  name: string;
  description?: string;
  scenario: string;
  status: string;
  createdByName: string;
  updatedOn: string;
  revision: number;
  state: SolutionState;
}

export interface BusinessPattern {
  id: string;
  source?: PatternSource;
  name: string;
  description: string;
  domainLanguage: string[];
  commonFeatures?: string[];
  strongSignals?: { description: string; keywords: string[] }[];
  weakSignals?: { description: string; keywords: string[] }[];
  serviceMappings: { service: string; reason: string }[];
  clarifyingQuestions: string[];
  assumptions?: string[];
  knownUnknowns?: string[];
}

export interface HandoffResult {
  workspacePath: string;
  solution: Solution;
}

export interface ConsultResult {
  service: string;
  fit: string;
  reason: string;
  questions: string[];
  dependencies: { service: string; satisfied: boolean }[];
  risks: string[];
  advice?: string;
  supports?: string[];
  constraints?: string[];
  validation?: { verdict: string; findings: string[] };
}

export type AnalysisMode = 'ai' | 'rules';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type PatternSource = 'built-in' | 'customized' | 'custom';
export type SpecialistIntent = 'ask' | 'recommend' | 'design' | 'validate' | 'sample';

export interface AnalysisOptions {
  modes: AnalysisMode[];
  defaultMode: AnalysisMode;
  model?: string;
}

export interface AnalysisInfo {
  mode: AnalysisMode;
  model?: string;
  warning?: string;
  analyzedOn: string;
}

export interface PatternMatch {
  patternId: string;
  patternName: string;
  score: number;
  level: ConfidenceLevel;
  matchedLanguage: string[];
  matchedSignals: string[];
  explanation: string;
}

export interface PatternMatchResult {
  matches: PatternMatch[];
  questions?: string[];
}

export interface SolutionArtifact {
  id: string;
  service: string;
  name: string;
  urn?: string;
  createdOn: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

export interface ConfidenceFactor {
  id: string;
  label: string;
  score: number;
  note?: string;
}

export interface SolutionConfidence {
  score: number;
  threshold: number;
  factors: ConfidenceFactor[];
}

export interface DiscoveryState {
  messages: ConversationMessage[];
  confidence: number;
  threshold: number;
  factors: ConfidenceFactor[];
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

export interface SpecialistValidation {
  verdict: string;
  findings: string[];
}

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
  validation?: SpecialistValidation;
  chatHighlights: string[];
  consultedOn: string;
}

export interface BlueprintWorkflow {
  name: string;
  actors: string[];
  steps: string[];
}

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
  specialistNotes: SpecialistNote[];
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

export interface CodeSample {
  language: string;
  title: string;
  code: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
  intent?: SpecialistIntent | string;
  mode?: AnalysisMode;
  model?: string;
  warning?: string;
  suggestions?: string[];
  samples?: CodeSample[];
  validation?: SpecialistValidation;
  followUps?: string[];
  consult?: {
    fit?: string;
    supports?: string[];
    constraints?: string[];
    risks?: string[];
    [key: string]: unknown;
  };
}

export interface ChatSummary {
  id: string;
  service: string;
  solutionId?: string;
  title: string;
  createdOn: string;
  updatedOn: string;
  messageCount: number;
}

export interface SpecialistChat {
  id: string;
  service: string;
  solutionId?: string;
  title: string;
  createdByName?: string;
  createdOn: string;
  updatedOn: string;
  messages: ChatMessage[];
}

export interface SpecialistChatExport {
  exportedAt?: string;
  chats: SpecialistChat[];
}

export interface SpecialistChatResponse {
  chatId: string;
  service: string;
  mode: AnalysisMode;
  warning?: string;
  reply: string;
  suggestions: string[];
  samples: CodeSample[];
  validation?: SpecialistValidation;
  followUps: string[];
  model?: string;
}

export interface PatternInput {
  id?: string;
  name: string;
  description: string;
  domainLanguage: string[];
  commonFeatures?: string[];
  strongSignals?: { description: string; keywords: string[] }[];
  weakSignals?: { description: string; keywords: string[] }[];
  serviceMappings: { service: string; reason: string }[];
  clarifyingQuestions: string[];
  assumptions?: string[];
  knownUnknowns?: string[];
}

export interface SolutionUpdate {
  name?: string;
  description?: string;
  problemStatement?: string;
}

export interface AnalyzeOptions {
  text?: string;
  mode?: AnalysisMode;
}

export interface DiscoveryOptions {
  message?: string;
  mode?: AnalysisMode;
  force?: boolean;
  restart?: boolean;
}

export interface BlueprintOptions {
  mode?: AnalysisMode;
  refreshConsultations?: boolean;
}

export interface ConsultOptions {
  mode?: AnalysisMode;
  question?: string;
  proposal?: string;
}

export interface SpecialistChatRequest {
  message: string;
  chatId?: string;
  intent?: SpecialistIntent;
  solutionId?: string;
  mode?: AnalysisMode;
}

export interface ChatCriteria {
  service?: string;
  solutionId?: string;
}