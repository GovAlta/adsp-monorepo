jest.mock('@mastra/core/agent', () => ({
  Agent: jest.fn().mockImplementation((config) => ({ config })),
}));
jest.mock('../../../../model/modelConfiguration', () => ({
  getAgentModelConfiguration: jest.fn(() => 'azure-openai/gpt-5.1'),
  getGenerationModelId: jest.fn(() => 'gpt-5.1'),
  getGenerationReasoningOptions: jest.fn(() => undefined),
}));

import { createGenerationAgents } from './agents';

type ConfiguredAgent = { config: { instructions: string } };

describe('createGenerationAgents', () => {
  const agents = createGenerationAgents();
  const categoryInstructions = (agents.categoryStepBuilder as unknown as ConfiguredAgent).config.instructions;
  const branchInstructions = (agents.branchStepBuilder as unknown as ConfiguredAgent).config.instructions;

  it.each([
    '"format": "email" for an email address',
    '"format": "phone" for a telephone number',
    '"format": "postalCode" for a Canadian postal code',
  ])('tells the page builder to validate fields by purpose: %s', (rule) => {
    expect(categoryInstructions).toContain(rule);
  });

  it('keeps the page builder rules out of the branch builder', () => {
    expect(branchInstructions).not.toContain('"format": "postalCode" for a Canadian postal code');
  });
});
