import React, { useMemo } from 'react';
import styled from 'styled-components';
import { AgentContextSelection } from '@core-services/app-common';

/**
 * Predefined question hierarchy for agent routing
 * Maps topics to subtopics with predefined questions and specialist hints
 */
export const QUESTION_HIERARCHY = {
  overview: {
    label: 'Overview',
    subtopics: {
      environments: {
        label: 'Environments',
        question: 'What environments does the Access Service run in, and what is the purpose of each?',
        agent: 'architectAgent',
      },
      responsibility: {
        label: 'Responsibility',
        question:
          'What is the relationship between ADSP and tenants, and who is responsible for each part of the Access Service?',
        agent: 'architectAgent',
      },
    },
  },
  clients: {
    label: 'Clients',
    subtopics: {
      'public-client': {
        label: 'Browser App (Client auth: Off)',
        question: 'How do I configure a browser application client in Keycloak v24? (Client authentication OFF)',
        agent: 'clientAgent',
      },
      'confidential-client': {
        label: 'Server-to-Server (Client auth: On)',
        question:
          'How do I configure a server-to-server client in Keycloak v24 with client credentials? (Client authentication ON)',
        agent: 'clientAgent',
      },
      'client-troubleshooting': {
        label: 'Client Troubleshooting',
        question: 'My client configuration seems wrong. Can you help me troubleshoot?',
        agent: 'clientAgent',
      },
    },
  },
  tokens: {
    label: 'Tokens',
    subtopics: {
      'token-claims': {
        label: 'Token Claims',
        question: 'What claims should be in my access token and how do I add custom claims?',
        agent: 'tokenRoleAgent',
      },
      'token-expiry': {
        label: 'Token Expiry',
        question: 'Why is my token expiring too quickly? How do I adjust token lifetimes?',
        agent: 'tokenRoleAgent',
      },
      'token-audience': {
        label: 'Token Audience',
        question: 'My token is missing the audience claim. How do I add the correct audience?',
        agent: 'tokenRoleAgent',
      },
      'idp-claim-to-token': {
        label: 'IdP Claim to Token',
        question: 'How do I add a claim from the identity provider to my access token (JWT)?',
        agent: 'tokenRoleAgent',
      },
    },
  },
  'identity-providers': {
    label: 'Identity Providers',
    subtopics: {
      'tenant-brokering': {
        label: 'Tenant Brokering',
        question:
          'What is the goa-ad cross-tenant IdP linked in the core realm, and how is it used for ADSP cross-tenant management?',
        agent: 'identityProviderAgent',
      },
      'uiam-integration': {
        label: 'UIAM Integration',
        question: 'What are the steps to integrate a UIAM (citizen or business) identity provider in Keycloak?',
        agent: 'identityProviderAgent',
      },
      'saml-certificates': {
        label: 'SAML 2.0 Certificates',
        question: 'What are the SAML 2.0 certificate requirements and renewal process for a UIAM identity provider?',
        agent: 'identityProviderAgent',
      },
    },
  },
  infrastructure: {
    label: 'Infrastructure & Disaster Recovery',
    subtopics: {
      'access-infrastructure': {
        label: 'Access Service Infrastructure',
        question:
          'Tell me about the Access Service infrastructure, high-availability design, and deployment topology. Include the deployment diagram, and explain how Keycloak pods are scheduled on ARO and how autoscaling works.',
        agent: 'architectAgent',
      },
      'disaster-recovery': {
        label: 'Disaster Recovery',
        question: 'What is the disaster recovery procedure for the Access Service? How do we recover from failures?',
        agent: 'architectAgent',
      },
    },
  },
};

export interface AgentContextSelectorProps {
  onAskQuestion: (question: string, context: AgentContextSelection) => void;
  disabled?: boolean;
}

const SelectorContainer = styled.div`
  width: 70%;
  min-width: min(100%, 20rem);
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-s);
  padding: var(--goa-space-s);
  background-color: var(--goa-color-greyscale-100);
  border-radius: var(--goa-border-radius-s);
  margin-bottom: var(--goa-space-s);
`;

const TopicSelectorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--goa-color-greyscale-700);
  display: block;
  margin-bottom: 0.25rem;
`;

const TopicSelect = styled.select`
  padding: 0.4rem 0.5rem;
  border: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-s);
  font-size: 0.8125rem;
  font-family: inherit;
  background-color: var(--goa-color-greyscale-white);
  cursor: pointer;

  &:hover {
    border-color: var(--goa-color-greyscale-400);
  }

  &:focus {
    outline: var(--goa-border-width-s) solid var(--goa-color-interactive-default);
    outline-offset: 2px;
  }

  &:disabled {
    background-color: var(--goa-color-greyscale-100);
    cursor: not-allowed;
    color: var(--goa-color-text-disabled);
  }
`;

const SubtopicButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
`;

const QuestionPill = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: var(--goa-border-width-s) solid var(--goa-color-interactive-default);
  background-color: var(--goa-color-info-light);
  color: var(--goa-color-interactive-default);
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease-in-out;
  position: relative;

  &:hover:not(:disabled) {
    background-color: var(--goa-color-interactive-default);
    color: var(--goa-color-greyscale-white);
  }

  &:focus:not(:disabled) {
    outline: var(--goa-border-width-s) solid var(--goa-color-interactive-default);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Tooltip styling */
  &::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--goa-color-greyscale-700);
    color: var(--goa-color-greyscale-white);
    padding: 0.5rem 0.75rem;
    border-radius: var(--goa-border-radius-s);
    font-size: 0.7rem;
    white-space: normal;
    width: 180px;
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease-in-out;
    line-height: 1.4;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  /* Tooltip arrow */
  &::before {
    content: '';
    position: absolute;
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--goa-color-greyscale-700);
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease-in-out;
  }

  &:hover::after,
  &:hover::before {
    opacity: 1;
  }
`;

export const AgentContextSelector: React.FC<AgentContextSelectorProps> = ({ onAskQuestion, disabled = false }) => {
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null);

  const subtopics = useMemo(
    () => (selectedTopic ? QUESTION_HIERARCHY[selectedTopic as keyof typeof QUESTION_HIERARCHY]?.subtopics : null),
    [selectedTopic],
  );

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTopic = e.target.value || null;
    setSelectedTopic(newTopic);
  };

  const handleAskQuestion = (subtopicKey: string) => {
    if (!selectedTopic) return;

    const topicSubtopics = QUESTION_HIERARCHY[selectedTopic as keyof typeof QUESTION_HIERARCHY]?.subtopics as
      | Record<string, { label: string; question: string; agent: string }>
      | undefined;
    const subtopic = topicSubtopics?.[subtopicKey];

    if (!subtopic) return;

    const context: AgentContextSelection = {
      context: selectedTopic,
      subtopic: subtopicKey,
      agent: subtopic.agent,
    };

    onAskQuestion(subtopic.question, context);
  };

  return (
    <SelectorContainer>
      <TopicSelectorWrapper>
        <Label htmlFor="topic-select">Select a topic (optional)</Label>
        <TopicSelect id="topic-select" value={selectedTopic || ''} onChange={handleTopicChange} disabled={disabled}>
          <option value="">-- Choose a topic --</option>
          {Object.entries(QUESTION_HIERARCHY).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </TopicSelect>
      </TopicSelectorWrapper>

      {subtopics && (
        <>
          <Label>Predefined questions</Label>
          <SubtopicButtonsWrapper>
            {Object.entries(subtopics).map(([key, value]) => (
              <QuestionPill
                key={key}
                onClick={() => handleAskQuestion(key)}
                disabled={disabled}
                data-tooltip={value.question}
                title={value.question}
              >
                {value.label}
              </QuestionPill>
            ))}
          </SubtopicButtonsWrapper>
        </>
      )}
    </SelectorContainer>
  );
};

export default AgentContextSelector;
