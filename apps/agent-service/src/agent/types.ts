import type { AdspId, User } from '@abgov/adsp-service-sdk';
import type { CoreUserMessage } from '@mastra/core/llm';
import type { RequestContext } from '@mastra/core/request-context';

export interface BrokerInputProcessor {
  processInput(
    requestContext: RequestContext<Record<string, unknown>>,
    input: CoreUserMessage | CoreUserMessage[]
  ): Promise<CoreUserMessage | CoreUserMessage[]>;
}

export type AdspRequestContext<TAdditional = never> = RequestContext<{ tenantId?: AdspId, user?: User } | TAdditional>
