import type { CoreUserMessage } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';

export interface BrokerInputProcessor {
  processInput(
    runtimeContext: RuntimeContext<Record<string, unknown>>,
    input: CoreUserMessage | CoreUserMessage[]
  ): Promise<CoreUserMessage | CoreUserMessage[]>;
}
