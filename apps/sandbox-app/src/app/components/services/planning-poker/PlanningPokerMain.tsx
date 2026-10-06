import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom-v7';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { GoabButton, GoabContainer, GoabFormItem, GoabInput, GoabText } from '@abgov/react-components';
import { POKER_NICKNAME_MAX_LENGTH } from '../../../state';
import { ServiceContainer } from '../../styled-components';
import { ServiceMainProps } from '../types';
import { buildSessionPath, extractSessionId, loadSavedNickname, saveNickname } from './pokerUtils';

export const PlanningPokerMain = ({ tenantName }: ServiceMainProps) => {
  const navigate = useNavigate();
  const [sessionInput, setSessionInput] = useState('');
  const [nickname, setNickname] = useState(loadSavedNickname);
  const sessionId = extractSessionId(sessionInput);

  const openSession = (id: string) => {
    saveNickname(nickname);
    navigate(buildSessionPath(tenantName, id));
  };

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        padding="compact"
        width={'full'}
        testId={'planningPokerContainer'}
        heading={'Planning poker'}
      >
        <Content>
          <GoabText size="body-m" mt="none" mb="m">
            Estimate stories as a team. Cards stay face down until everyone has voted. Built without a backend using the
            script, value, event and push services.
          </GoabText>
          <NicknameField>
            <GoabFormItem
              label="Your nickname"
              labelSize="compact"
              requirement="optional"
              helpText="Shown to everyone in the session instead of your name."
            >
              <GoabInput
                name="nickname"
                value={nickname}
                size="compact"
                width="100%"
                maxLength={POKER_NICKNAME_MAX_LENGTH}
                testId="poker-join-nickname"
                onChange={(detail) => setNickname(detail.value)}
              />
            </GoabFormItem>
          </NicknameField>
          <Options>
            <Option aria-label="Start a new session">
              <GoabText tag="h3" size="heading-xs" mt="none" mb="xs">
                Start a new session
              </GoabText>
              <GoabText size="body-s" mt="none" mb="s">
                You get a link to share with your team.
              </GoabText>
              <GoabButton size="compact" testId="poker-new-session" onClick={() => openSession(uuidv4())}>
                Start new session
              </GoabButton>
            </Option>
            <Option aria-label="Join a session">
              <GoabText tag="h3" size="heading-xs" mt="none" mb="xs">
                Join a session
              </GoabText>
              <JoinRow>
                <GoabFormItem label="Session link or ID" labelSize="compact">
                  <GoabInput
                    name="sessionId"
                    value={sessionInput}
                    size="compact"
                    width="100%"
                    placeholder="Paste the link a teammate shared"
                    testId="poker-session-input"
                    onChange={(detail) => setSessionInput(detail.value)}
                    onKeyPress={({ key }) => key === 'Enter' && sessionId && openSession(sessionId)}
                  />
                </GoabFormItem>
                <GoabButton
                  type="secondary"
                  size="compact"
                  disabled={!sessionId}
                  testId="poker-join-session"
                  onClick={() => openSession(sessionId)}
                >
                  Join
                </GoabButton>
              </JoinRow>
            </Option>
          </Options>
        </Content>
      </GoabContainer>
    </ServiceContainer>
  );
};

const Content = styled.div`
  max-width: 56rem;
`;

const NicknameField = styled.div`
  max-width: 24rem;
  margin-bottom: var(--goa-space-m);
`;

const Options = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: var(--goa-space-m);
`;

const Option = styled.section`
  padding: var(--goa-space-m);
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-l);
`;

const JoinRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--goa-space-s);

  > :first-child {
    flex: 1 1 auto;
    min-width: 0;
  }
`;
