import type { User } from '@abgov/adsp-service-sdk';
import type { RequestContext } from '@mastra/core/request-context';

/**
 * Wraps agent instructions to automatically inject contextual information on each request.
 * Includes current date/time and user information to help agents with temporal awareness
 * and personalized responses. Returns a function matching Mastra's DynamicArgument signature,
 * evaluated per-request.
 *
 * The per-request context goes last: model providers cache a prompt by its exact prefix, so the static
 * instructions must come first for repeat calls to reuse that cache.
 */
export function withContextualInstructions(instructions: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ requestContext }: { requestContext: RequestContext<any> }) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentDateTime = now.toISOString();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    const user = requestContext.get('user') as User | undefined;
    const userName = user?.name || 'User';

    return `Tool call contract:
- Before each tool call, verify required input fields and types.
- If required input is missing, ask a concise clarifying question first.
- Use exact schema field names and provide complete input objects.

${instructions}

Request context:
Current date: ${currentDate} (${dayOfWeek})
Current time: ${currentDateTime}
User: ${userName}`;
  };
}
