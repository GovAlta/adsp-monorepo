import React, { FunctionComponent } from 'react';
import type { ToolCall } from '@core-services/app-common';
import styled from 'styled-components';
import type { AccessGuideSection } from '@store/agent/model';

export const ACCESS_GUIDE_TOOL = 'getAccessGuide';

function describeGuideRead(toolCall: ToolCall): string {
  if (toolCall.error != null) {
    return 'Could not read the Access Service guide.';
  }
  if (toolCall.result == null) {
    return 'Reading the Access Service guide…';
  }
  const { title } = toolCall.result as Partial<AccessGuideSection>;
  return title ? `Read the Access Service guide: ${title}` : 'Read the Access Service guide';
}

/** One quiet line saying the agent read the guide; what it read shows up in the answer, so the text is not repeated. */
export const AccessGuideToolCall: FunctionComponent<{ toolCall: ToolCall }> = ({ toolCall }) => (
  <GuideLine data-testid={`access-tool-${ACCESS_GUIDE_TOOL}`}>{describeGuideRead(toolCall)}</GuideLine>
);

const GuideLine = styled.p`
  margin: 0 var(--goa-space-xl) var(--goa-space-s) var(--goa-space-xl);
  color: var(--goa-color-text-secondary);
  font-size: var(--goa-font-size-1);
`;
