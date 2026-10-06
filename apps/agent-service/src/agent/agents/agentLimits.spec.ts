import { environment } from '../../environments/environment';
import { builderAgent } from './builder';
import { formGenerationAgent } from './forms/generation/chat/agentConfiguration';

describe('agent execution limits', () => {
  it('sets the form generation agent limits from the environment so deployments can still tune them', () => {
    expect(formGenerationAgent.maxSteps).toBe(environment.AGENT_FORM_GENERATION_MAX_STEPS);
    expect(formGenerationAgent.timeoutMs).toBe(environment.AGENT_FORM_GENERATION_TIMEOUT_MS);
  });

  it('gives the builder agent enough steps to reply after its tool calls', () => {
    expect(builderAgent.maxSteps).toBe(30);
    expect(builderAgent.timeoutMs).toBeUndefined();
  });
});
