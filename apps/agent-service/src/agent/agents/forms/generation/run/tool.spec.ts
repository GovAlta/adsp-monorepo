jest.mock('@mastra/core/tools', () => ({ createTool: jest.fn((config) => config) }));
jest.mock('../llm/agents', () => ({ createGenerationAgents: jest.fn(() => ({})) }));
jest.mock('./orchestrator', () => ({ runFormGeneration: jest.fn() }));
jest.mock('./progress', () => ({ createProgressEmitter: jest.fn(() => jest.fn()) }));

import type { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import type { Logger } from 'winston';
import { runFormGeneration } from './orchestrator';
import { createFormGenerationTools } from './tool';

type ExecutableTool = {
  execute: (input: { requirement: string }, context: unknown) => Promise<{ summary: string }>;
};

const emptyRun = {
  complexity: 'SIMPLE',
  planReason: 'No requirements document is attached and the request does not describe any questions.',
  documentCount: 0,
  total: 0,
  saved: 0,
  savedLabels: [],
  recoveredLabels: [],
  notAttemptedLabels: [],
  failures: [],
  rootType: 'VerticalLayout',
  propertyCount: 0,
  categoryCount: 0,
  controlCount: 0,
  validation: { ok: true, errors: [] },
};

const builtRun = {
  ...emptyRun,
  complexity: 'COMPLEX',
  planReason: 'Two named sections.',
  documentCount: 1,
  total: 2,
  saved: 2,
  savedLabels: ['Declaration of Trade Name', 'INSTRUCTIONS'],
};

describe('formGenerationRun', () => {
  const directory = {
    getServiceUrl: jest.fn().mockResolvedValue(new URL('https://configuration-service.example.ca/configuration/v2')),
  } as unknown as ServiceDirectory;
  const values: Record<string, unknown> = { formDefinitionId: 'reg3018', sourceDocuments: [] };
  const context = { requestContext: { get: (key: string) => values[key] } };

  const summaryFor = async (run: typeof emptyRun) => {
    (runFormGeneration as jest.Mock).mockResolvedValue(run);
    const { formGenerationRun } = await createFormGenerationTools({
      directory,
      tokenProvider: {} as TokenProvider,
      logger: {} as Logger,
    });
    const { summary } = await (formGenerationRun as unknown as ExecutableTool).execute(
      { requirement: 'Build this form from the attached document.' },
      context,
    );
    return summary;
  };

  it('reports that nothing was built when nothing was planned', async () => {
    const summary = await summaryFor(emptyRun);

    expect(summary).toContain('Nothing was built and the form was not changed.');
  });

  it('does not report an empty run as a success', async () => {
    const summary = await summaryFor(emptyRun);

    expect(summary).not.toContain('Every planned step was built');
  });

  it("includes the planner's reason when nothing was planned", async () => {
    const summary = await summaryFor(emptyRun);

    expect(summary).toContain(`Planner: ${emptyRun.planReason}`);
  });

  it('tells the agent to ask for the document again when none reached the run', async () => {
    const summary = await summaryFor(emptyRun);

    expect(summary).toContain('No attached document reached this request.');
  });

  it('does not mention a missing document when one reached the run', async () => {
    const summary = await summaryFor({ ...emptyRun, documentCount: 1 });

    expect(summary).not.toContain('No attached document reached this request.');
  });

  it('reports a completed build as before', async () => {
    const summary = await summaryFor(builtRun);

    expect(summary).toBe('Saved 2 of 2 planned steps.\n- Every planned step was built and the form validates.');
  });
});
