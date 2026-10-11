// IntegrationPendingBanner — standardised stub notice for INT-xxx integrations.
// Wraps GoACallout type="information".

import React from 'react';
import { GoACallout } from '@abgov/react-components';

const INT_MESSAGES: Record<string, { heading: string; body: string }> = {
  'INT-001': {
    heading: 'Planning Agent is in test mode',
    body:
      'The AI Planning Agent (INT-001) is currently operating in stub mode pending contract approval ' +
      'for the Anthropic Claude API (OPEN-001, OPEN-002, OPEN-006). In this mode, the agent will not ' +
      'process your business problem description or generate concept extractions. You can still navigate ' +
      'the planning workspace and familiarise yourself with the interface. Messaging will resume when ' +
      'the integration is activated.',
  },
  'INT-003': {
    heading: 'Form Service Specialist not yet available',
    body: 'Form Service Specialist (INT-003) is not yet available. Specialist integrations are pending OPEN-005 resolution.',
  },
  'INT-004': {
    heading: 'PDF Service Specialist not yet available',
    body: 'PDF Service Specialist (INT-004) is not yet available.',
  },
  'INT-005': {
    heading: 'Comment Service Specialist not yet available',
    body: 'Comment Service Specialist (INT-005) is not yet available.',
  },
  'INT-006': {
    heading: 'Notification Service Specialist not yet available',
    body: 'Notification Service Specialist (INT-006) is not yet available.',
  },
};

export interface IntegrationPendingBannerProps {
  /** The integration identifier, e.g. "INT-001". */
  intId: string;
  /** Override heading (falls back to INT_MESSAGES lookup). */
  heading?: string;
  /** Override body text (falls back to INT_MESSAGES lookup). */
  body?: string;
}

const IntegrationPendingBanner: React.FC<IntegrationPendingBannerProps> = ({
  intId,
  heading,
  body,
}) => {
  const defaults = INT_MESSAGES[intId] ?? {
    heading: `Integration ${intId} is not yet available`,
    body: `The ${intId} integration is currently in stub mode. Functionality will resume once the integration is activated.`,
  };

  return (
    <GoACallout
      type="information"
      heading={heading ?? defaults.heading}
    >
      {body ?? defaults.body}
    </GoACallout>
  );
};

export default IntegrationPendingBanner;
