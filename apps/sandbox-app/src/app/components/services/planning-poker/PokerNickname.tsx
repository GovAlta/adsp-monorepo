import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { GoabButton, GoabFormItem, GoabInput } from '@abgov/react-components';
import { POKER_NICKNAME_MAX_LENGTH } from '../../../state';

interface PokerNicknameProps {
  nickname: string;
  defaultName: string;
  saving: boolean;
  onSave: (nickname: string) => void;
}

export const PokerNickname = ({ nickname, defaultName, saving, onSave }: PokerNicknameProps) => {
  const [value, setValue] = useState(nickname);

  // Keep the field in step when the saved nickname is restored after the first render.
  useEffect(() => {
    setValue(nickname);
  }, [nickname]);

  const trimmed = value.trim();

  return (
    <NicknameRow>
      <GoabFormItem
        label="Your nickname"
        requirement="optional"
        helpText={`Shown to everyone in the session. Leave blank to use ${defaultName}.`}
      >
        <GoabInput
          name="nickname"
          value={value}
          width="100%"
          maxLength={POKER_NICKNAME_MAX_LENGTH}
          placeholder={defaultName}
          testId="poker-nickname"
          onChange={(detail) => setValue(detail.value)}
        />
      </GoabFormItem>
      <GoabButton
        type="secondary"
        disabled={saving || trimmed === nickname}
        testId="poker-save-nickname"
        onClick={() => onSave(trimmed)}
      >
        Save nickname
      </GoabButton>
    </NicknameRow>
  );
};

const NicknameRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--goa-space-m);

  > :first-child {
    flex: 1 1 280px;
  }
`;
