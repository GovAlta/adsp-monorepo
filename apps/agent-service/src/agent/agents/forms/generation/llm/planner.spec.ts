jest.mock('./agents', () => ({
  generationCallOptions: jest.fn(() => ({})),
}));

import type { GenerationLog } from '../run/log';
import type { GenerationAgents } from './agents';
import { planFormGeneration } from './planner';
import { generationPlanSchema } from '../types';

describe('planFormGeneration', () => {
  const generate = jest.fn();
  const agents = { planner: { generate } } as unknown as GenerationAgents;
  const log = { record: jest.fn() } as unknown as GenerationLog;

  beforeEach(() => {
    generate.mockReset();
    generate.mockResolvedValue({
      object: {
        complexity: 'COMPLEX',
        reason: 'Two pages',
        steps: [
          { type: 'category', label: 'Business details', sectionId: 'document' },
          { type: 'category', label: 'Authorized representative', sectionId: 'document' },
        ],
      },
    });
  });

  const plan = () =>
    planFormGeneration({
      agents,
      requirement: 'Build this form',
      documents: [],
      current: { rootType: 'VerticalLayout', categoryLabels: [], propertyCount: 0 },
      variant: 'pages',
      log,
    });

  it('tells the planner not to use page numbers or extraction markers as page titles', async () => {
    await plan();

    const [prompt] = generate.mock.calls[0];
    expect(prompt).toContain('A section marked (untitled) has no title of its own');
  });

  it('tells the planner to name every question in exactly one step', async () => {
    await plan();

    const [prompt] = generate.mock.calls[0];
    expect(prompt).toContain('Every question the applicant answers must be named in exactly one step');
  });

  it('tells the planner to return no steps rather than a placeholder when there is nothing to build', async () => {
    await plan();

    const [prompt] = generate.mock.calls[0];
    expect(prompt).toContain('return an empty steps list and say why in reason. Never plan a placeholder step.');
  });

  it('accepts an empty plan when there is nothing to build', async () => {
    generate.mockResolvedValue({
      object: { complexity: 'SIMPLE', reason: 'No requirements document is attached.', steps: [] },
    });

    const result = await plan();

    expect(result.steps).toEqual([]);
  });

  it('accepts an empty steps list in the plan schema', () => {
    const parsed = generationPlanSchema.safeParse({ complexity: 'SIMPLE', reason: 'Nothing to build.', steps: [] });

    expect(parsed.success).toBe(true);
  });

  it('uses the planned labels as the page titles', async () => {
    const result = await plan();

    expect(result.categoryLabels).toEqual(['Business details', 'Authorized representative']);
  });
});
