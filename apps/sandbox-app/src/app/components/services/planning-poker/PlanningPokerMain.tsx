import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { GoabButton, GoabButtonGroup, GoabContainer, GoabFormItem, GoabInput, GoabText } from '@abgov/react-components';
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
        width={'full'}
        testId={'planningPokerContainer'}
        heading={'Planning poker'}
      >
        <GoabText size="body-m" mt="none">
          Estimate stories as a team. Votes stay hidden until someone reveals them. Built without a backend using the
          script, value, event and push services.
        </GoabText>
        <GoabFormItem
          label="Nickname"
          requirement="optional"
          helpText="Shown to everyone in the session instead of your name."
          mb="l"
        >
          <GoabInput
            name="nickname"
            value={nickname}
            width="100%"
            maxLength={POKER_NICKNAME_MAX_LENGTH}
            testId="poker-join-nickname"
            onChange={(detail) => setNickname(detail.value)}
          />
        </GoabFormItem>
        <GoabFormItem label="Join a session" helpText="Paste the session link or ID shared by a teammate.">
          <GoabInput
            name="sessionId"
            value={sessionInput}
            width="100%"
            testId="poker-session-input"
            onChange={(detail) => setSessionInput(detail.value)}
          />
        </GoabFormItem>
        <GoabButtonGroup alignment="start" mt="l">
          <GoabButton
            type="secondary"
            disabled={!sessionId}
            testId="poker-join-session"
            onClick={() => openSession(sessionId)}
          >
            Join session
          </GoabButton>
          <GoabButton testId="poker-new-session" onClick={() => openSession(uuidv4())}>
            Start new session
          </GoabButton>
        </GoabButtonGroup>
      </GoabContainer>
    </ServiceContainer>
  );
};
