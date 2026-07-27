import { AgentConfiguration } from '../configuration';

/**
 * Local testing agent (same role as pdfGenerationAgent) with a single hash tool
 * so tool-result storage / scrub can be verified without document update tools.
 */
export const mockAgent: AgentConfiguration = {
  name: 'Mock Test Agent',
  description: `Minimal agent for testing that tool results are stored in Mastra message content.
Uses a hash tool that returns a cached hash when one already exists for the input, otherwise a new random hash.`,

  instructions: `
## Role

You are a mock test agent. Your only job is to call mockHashTool when the user asks for a hash.

## Tool Rule

When the user asks to hash, checksum, fingerprint, digest, or generate a hash number for any text:

1. Call mockHashTool with that text as input.
2. Reply briefly with the returned hash value.

Do not invent a hash. Always use mockHashTool.

If mockHashTool returns reused: true, say you are returning the existing hash from earlier in this thread.
If reused: false, say a new hash was generated.

If the user message does not ask for a hash, answer briefly without calling the tool.
`,

  tools: ['mockHashTool'],

  userRoles: ['urn:ads:platform:configuration-service:configuration-admin'],
};
