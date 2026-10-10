export interface BusinessConcept {
  id: string;
  type: string;
  name: string;
  description?: string;
  source: string;
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
  hypotheses: Hypothesis[];
  specialists: SpecialistProgress[];
  nextSteps: NextStep[];
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
  name: string;
  description: string;
  domainLanguage: string[];
  serviceMappings: { service: string; reason: string }[];
  clarifyingQuestions: string[];
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
}
