jest.mock('./agents', () => ({
  generationCallOptions: jest.fn(() => ({})),
}));

import type { GenerationLog } from '../run/log';
import type { GenerationAgents } from './agents';
import { generateStepPayload, selectStepBuilder } from './stepBuilder';
import type { GenerationPlan, PlannedStep } from '../types';
import { UsageRecorder } from '../../../../model/conversationUsage';

describe('generateStepPayload', () => {
  const generate = jest.fn();
  const agents = {
    categoryStepBuilder: { generate },
    computedCategoryStepBuilder: { generate },
    branchStepBuilder: { generate },
  } as unknown as GenerationAgents;
  const log = { record: jest.fn() } as unknown as GenerationLog;
  const step = {
    index: 1,
    type: 'category',
    label: 'Business details',
    sectionId: 'document',
  } as unknown as PlannedStep;
  const plan: GenerationPlan = {
    complexity: 'SIMPLE',
    reason: 'One page',
    variant: 'pages',
    categoryLabels: ['Business details'],
    steps: [step],
  };

  it('records the step builder call in the usage recorder', async () => {
    // Arrange
    const usage = new UsageRecorder();
    generate.mockResolvedValue({
      object: { dataSchemaProperties: {}, required: [], uiElements: [] },
      totalUsage: { inputTokens: 20500, outputTokens: 2600, totalTokens: 23100 },
      steps: [{}],
    });

    // Act
    await generateStepPayload({
      agents,
      plan,
      step,
      documents: [],
      context: { existingProperties: [], existingScopes: [], categoryLabels: ['Business details'] },
      log,
      usage,
    });

    // Assert
    expect(usage.total).toEqual({ inputTokens: 20500, outputTokens: 2600, totalTokens: 23100, modelCalls: 1 });
  });
});

describe('selectStepBuilder', () => {
  const agents = {
    categoryStepBuilder: { id: 'category' },
    computedCategoryStepBuilder: { id: 'computed' },
    branchStepBuilder: { id: 'branch' },
  } as unknown as GenerationAgents;
  const page = (detail: string) => ({ index: 1, type: 'category', label: 'Budget', detail }) as unknown as PlannedStep;

  it('builds a branch with the branch builder', () => {
    // Act
    const builder = selectStepBuilder(agents, { ...page(''), type: 'branch' } as PlannedStep, []);

    // Assert
    expect(builder).toBe(agents.branchStepBuilder);
  });

  it('builds a page that calculates something with the computed field examples', () => {
    // Act
    const builder = selectStepBuilder(agents, page('travel, equipment and the total of both'), []);

    // Assert
    expect(builder).toBe(agents.computedCategoryStepBuilder);
  });

  it('builds any other page with the plain page builder', () => {
    // Act
    const builder = selectStepBuilder(agents, page('project title, description and start date'), []);

    // Assert
    expect(builder).toBe(agents.categoryStepBuilder);
  });
});
