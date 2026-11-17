import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { AgentContextSelection } from '@core-services/app-common';
import { ACCESS_SERVICE_AGENT_ID, AccessGuideTopic } from '@store/agent/model';
import { PredefinedQuestionForm } from './PredefinedQuestionForm';
import { isTemplatedQuestion, PredefinedQuestion, QuestionInput, QuestionTopic } from './predefinedQuestion';

const PERSON_INPUT: QuestionInput = { name: 'person', label: 'Username or email', placeholder: 'jane.doe@gov.ab.ca' };
const APP_INPUT: QuestionInput = { name: 'app', label: 'App name or client ID', placeholder: 'my-app' };
const ROLE_INPUT: QuestionInput = { name: 'role', label: 'Role name', placeholder: 'form-admin' };

/**
 * Predefined questions by topic. The topic and subtopic keys are sent as the agentContext hint the agent routes by.
 * Questions with a guideTopic are answered from the Access Service guide without AI; questions with a template ask for
 * the names they need before they are sent.
 */
export const QUESTION_HIERARCHY: Record<string, QuestionTopic> = {
  'common-questions': {
    label: 'Common Questions (start here)',
    subtopics: {
      'is-admin': {
        label: 'Is Someone an Admin?',
        question: 'I want to check whether someone in my tenant is a tenant admin.',
        inputs: [PERSON_INPUT],
        template: 'Is {person} a tenant admin?',
      },
      'cannot-sign-in': {
        label: "Why Can't Someone Sign In?",
        question: "Someone in my tenant can't sign in. Help me find out why.",
        inputs: [PERSON_INPUT],
        template: "Why can't {person} sign in?",
      },
      'access-denied': {
        label: 'Why "Access Denied"?',
        question:
          'Someone gets an access denied or 403 error in an app or ADSP service. Help me find out what they are missing.',
        inputs: [PERSON_INPUT, { name: 'service', label: 'App or ADSP service', placeholder: 'form-service' }],
        template: '{person} gets access denied in {service}. What are they missing?',
      },
      'who-is-admin': {
        label: 'Who Has Admin?',
        question: 'Who are the tenant admins in my realm?',
      },
      'app-setup': {
        label: 'Is My App Set Up Right?',
        question: 'Is my app set up correctly in Keycloak? Help me check it.',
        inputs: [APP_INPUT],
        template: 'Is my app {app} set up correctly in Keycloak?',
      },
      'service-account-roles': {
        label: 'What Can My Service Call?',
        question:
          "What roles does my backend service's service account have, and can it call the ADSP services it needs?",
        inputs: [{ ...APP_INPUT, label: "Service's client ID", placeholder: 'my-backend-service' }],
        template: 'What roles does the service account of {app} have, and can it call the ADSP services it needs?',
      },
    },
  },
  overview: {
    label: 'Overview',
    subtopics: {
      environments: {
        label: 'Environments',
        question: 'What environments does the Access Service run in, and what is the purpose of each?',
        guideTopic: 'environments',
      },
      responsibility: {
        label: 'Responsibility',
        question:
          'What is the relationship between ADSP and tenants, and who is responsible for each part of the Access Service?',
        guideTopic: 'responsibility',
      },
    },
  },
  'environment-realm': {
    label: 'My Environment & Realm',
    subtopics: {
      'inspectable-environments': {
        label: 'Inspectable Environments',
        question: 'List the Access Service environments and tell me which ones I can inspect.',
      },
      'my-realms': {
        label: 'My Realms',
        question: 'Which realms can I inspect in this environment?',
      },
      'realm-details': {
        label: 'Realm Details',
        question: 'Show me the basic identifying information for my realm.',
      },
    },
  },
  'my-clients': {
    label: 'My Clients',
    subtopics: {
      'list-clients': {
        label: 'List Clients',
        question: 'List the clients in my realm.',
      },
      'inspect-client': {
        label: 'Inspect a Client',
        question: 'I want to inspect the configuration of a client in my realm.',
        inputs: [APP_INPUT],
        template: 'Show me the configuration of the client {app}.',
      },
      'client-redirects': {
        label: 'Redirect URIs & Web Origins',
        question: 'Show me the redirect URIs and web origins configured for a client in my realm.',
        inputs: [APP_INPUT],
        template: 'Show me the redirect URIs and web origins configured for {app}.',
      },
      'client-roles-scopes': {
        label: 'Roles, Scopes & Mappers',
        question: 'Show me the roles, client scopes and protocol mappers configured for a client in my realm.',
        inputs: [APP_INPUT],
        template: 'Show me the roles, client scopes and protocol mappers configured for {app}.',
      },
      'redirect-error': {
        label: 'Sign-in Address Error',
        question:
          'My app shows "Invalid parameter: redirect_uri" or a CORS error when signing in. Help me check its addresses.',
        inputs: [APP_INPUT, { name: 'address', label: 'App address', placeholder: 'https://myapp.alberta.ca' }],
        template:
          'My app {app} at {address} shows "Invalid parameter: redirect_uri" or a CORS error when signing in. Check its addresses.',
      },
      'token-preview': {
        label: 'Preview a Token',
        question: 'Show me what an access token from one of my apps would contain.',
        inputs: [APP_INPUT],
        template: 'Show me what an access token from {app} would contain.',
      },
    },
  },
  'my-users': {
    label: 'My Users & Roles',
    subtopics: {
      'find-user': {
        label: 'Find a User',
        question: 'I want to find a user in my realm.',
        inputs: [PERSON_INPUT],
        template: 'Find user {person}.',
      },
      'user-roles': {
        label: 'User Role Assignments',
        question: 'Show me the realm and client roles assigned to a user in my realm, and where each one comes from.',
        inputs: [PERSON_INPUT],
        template: 'Show me the roles assigned to {person}, and where each one comes from.',
      },
      'compare-users': {
        label: 'Compare Two Users',
        question: 'Why can one person in my tenant do something another person cannot? Compare their access.',
        inputs: [
          { ...PERSON_INPUT, name: 'first', label: 'First person' },
          { ...PERSON_INPUT, name: 'second', label: 'Second person', placeholder: 'john.smith@gov.ab.ca' },
        ],
        template: 'Why can {first} do something {second} cannot? Compare their access.',
      },
      'role-members': {
        label: 'Who Has a Role',
        question: 'I want to see who in my realm has a particular role.',
        inputs: [ROLE_INPUT],
        template: 'Who in my realm has the {role} role?',
      },
      'role-meaning': {
        label: 'What a Role Means',
        question: 'Explain what a role lets someone do and which roles give it.',
        inputs: [ROLE_INPUT],
        template: 'Explain what the {role} role lets someone do and which roles give it.',
      },
    },
  },
  clients: {
    label: 'Clients',
    subtopics: {
      'public-client': {
        label: 'Browser App (Client auth: Off)',
        question: 'How do I configure a browser application client in Keycloak v24? (Client authentication OFF)',
        guideTopic: 'public-client',
      },
      'confidential-client': {
        label: 'Server-to-Server (Client auth: On)',
        question:
          'How do I configure a server-to-server client in Keycloak v24 with client credentials? (Client authentication ON)',
        guideTopic: 'confidential-client',
      },
      'client-troubleshooting': {
        label: 'Client Troubleshooting',
        question: 'My client configuration seems wrong. Can you help me troubleshoot?',
        inputs: [APP_INPUT],
        template: 'My client {app} configuration seems wrong. Help me troubleshoot it.',
      },
    },
  },
  tokens: {
    label: 'Tokens',
    subtopics: {
      'token-claims': {
        label: 'Token Claims',
        question: 'What claims should be in my access token and how do I add custom claims?',
        guideTopic: 'token-claims',
      },
      'token-expiry': {
        label: 'Token Expiry',
        question: 'Why is my token expiring too quickly? How do I adjust token lifetimes?',
        guideTopic: 'token-expiry',
      },
      'token-audience': {
        label: 'Token Audience',
        question: 'My token is missing the audience claim. How do I add the correct audience?',
        guideTopic: 'token-audience',
      },
      'idp-claim-to-token': {
        label: 'IdP Claim to Token',
        question: 'How do I add a claim from the identity provider to my access token (JWT)?',
        guideTopic: 'idp-claim-to-token',
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
      },
      'goa-ad': {
        label: 'goa-ad and UIAM',
        question: 'What are the goa-ad and UIAM identity providers, and when is each one used?',
        guideTopic: 'goa-ad',
      },
      'uiam-integration': {
        label: 'UIAM Integration',
        question: 'What are the steps to integrate a UIAM (citizen or business) identity provider in Keycloak?',
        guideTopic: 'uiam-integration',
      },
      'saml-certificates': {
        label: 'SAML 2.0 Certificates',
        question: 'What are the SAML 2.0 certificate requirements and renewal process for a UIAM identity provider?',
        guideTopic: 'saml-certificates',
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
        guideTopic: 'architecture',
      },
      'disaster-recovery': {
        label: 'Disaster Recovery',
        question: 'What is the disaster recovery procedure for the Access Service? How do we recover from failures?',
        guideTopic: 'disaster-recovery',
      },
    },
  },
};

export interface AgentContextSelectorProps {
  /** guideTopic is set for a question the Access Service guide answers without AI. */
  onAskQuestion: (question: string, context: AgentContextSelection, guideTopic?: AccessGuideTopic) => void;
  disabled?: boolean;
}

const SelectorContainer = styled.div`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-s);
  padding: var(--goa-space-s);
  background-color: var(--goa-color-greyscale-100);
  border-radius: var(--goa-border-radius-s);
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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [formSubtopicKey, setFormSubtopicKey] = useState<string | null>(null);

  const subtopics = useMemo(
    () => (selectedTopic ? QUESTION_HIERARCHY[selectedTopic]?.subtopics : null),
    [selectedTopic],
  );
  const formQuestion = formSubtopicKey ? subtopics?.[formSubtopicKey] : undefined;

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTopic(e.target.value || null);
    setFormSubtopicKey(null);
  };

  const contextFor = (subtopicKey: string): AgentContextSelection => ({
    context: selectedTopic,
    subtopic: subtopicKey,
    agent: ACCESS_SERVICE_AGENT_ID,
  });

  const handleQuestionClick = (subtopicKey: string, subtopic: PredefinedQuestion) => {
    if (isTemplatedQuestion(subtopic)) {
      setFormSubtopicKey(subtopicKey);
      return;
    }

    setFormSubtopicKey(null);
    onAskQuestion(subtopic.question, contextFor(subtopicKey), subtopic.guideTopic);
  };

  const handleFormAsk = (question: string) => {
    onAskQuestion(question, contextFor(formSubtopicKey));
    setFormSubtopicKey(null);
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
                onClick={() => handleQuestionClick(key, value)}
                disabled={disabled}
                aria-expanded={isTemplatedQuestion(value) ? formSubtopicKey === key : undefined}
                data-tooltip={value.question}
                title={value.question}
              >
                {value.label}
              </QuestionPill>
            ))}
          </SubtopicButtonsWrapper>
        </>
      )}

      {formQuestion && isTemplatedQuestion(formQuestion) && (
        <PredefinedQuestionForm
          key={formSubtopicKey}
          question={formQuestion}
          disabled={disabled}
          onAsk={handleFormAsk}
          onCancel={() => setFormSubtopicKey(null)}
        />
      )}
    </SelectorContainer>
  );
};

export default AgentContextSelector;
