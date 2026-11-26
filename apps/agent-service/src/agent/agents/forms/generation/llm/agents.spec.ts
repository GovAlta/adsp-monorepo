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
  const computedInstructions = (agents.computedCategoryStepBuilder as unknown as ConfiguredAgent).config.instructions;

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

  it('sends each step the anti-patterns as a checklist, without the best practices', () => {
    expect(categoryInstructions).toContain('## Schema checklist');
    expect(categoryInstructions).not.toContain('# Best Practices');
    expect(categoryInstructions).not.toContain('# Anti-Patterns');
  });

  it('tells the page builder to use the ADSP common definitions for names, addresses, email and phone', () => {
    expect(categoryInstructions).toContain(
      'Use the ADSP common definitions instead of building these fields from scratch',
    );
    expect(categoryInstructions).toContain("personFullName (a person's name)");
  });

  it('gives the computed field examples only to the computed page builder', () => {
    expect(categoryInstructions).not.toContain('# Computed Field Examples');
    expect(computedInstructions).toContain('# Computed Field Examples');
  });
});
