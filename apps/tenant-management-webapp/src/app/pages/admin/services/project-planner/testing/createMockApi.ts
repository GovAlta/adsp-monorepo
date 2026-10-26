import { PlannerApi } from '../api';

export type MockPlannerApi = { [K in keyof PlannerApi]: jest.Mock };

const METHODS: (keyof PlannerApi)[] = [
  'listSolutions',
  'getSolution',
  'createSolution',
  'deleteSolution',
  'updateSolution',
  'analyze',
  'getAnalysisOptions',
  'chat',
  'answerQuestion',
  'reviewComponent',
  'discovery',
  'blueprint',
  'consult',
  'exportSolution',
  'listSpecialists',
  'specialistChat',
  'listChats',
  'getChat',
  'exportChat',
  'exportAllChats',
  'deleteChat',
  'listPatterns',
  'createPattern',
  'updatePattern',
  'deletePattern',
];

/** Creates a PlannerApi where every method is a jest.fn() resolving to undefined unless overridden. */
export function createMockApi(overrides: Partial<PlannerApi> = {}): MockPlannerApi {
  const api = {} as MockPlannerApi;
  for (const method of METHODS) {
    api[method] = jest.fn().mockResolvedValue(undefined);
  }
  return Object.assign(api, overrides) as MockPlannerApi;
}
