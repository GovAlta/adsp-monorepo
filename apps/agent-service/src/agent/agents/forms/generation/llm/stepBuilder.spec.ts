jest.mock('./agents', () => ({
  generationCallOptions: jest.fn(() => ({})),
}));

import type { GenerationLog } from '../run/log';
import type { GenerationAgents } from './agents';
import { generateStepPayload } from './stepBuilder';
import type { GenerationPlan, PlannedStep } from '../types';
import { UsageRecorder } from '../../../../model/conversationUsage';

describe('generateStepPayload', () => {
  const generate = jest.fn();
  const agents = { categoryStepBuilder: { generate }, branchStepBuilder: { generate } } as unknown as GenerationAgents;
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
