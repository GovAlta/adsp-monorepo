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
  const canSave = !saving && trimmed !== nickname;

  const save = () => {
    if (canSave) {
      onSave(trimmed);
    }
  };

  return (
    <NicknameRow>
      <GoabFormItem label="Your nickname" labelSize="compact" requirement="optional">
        <GoabInput
          name="nickname"
          value={value}
          size="compact"
          width="100%"
          maxLength={POKER_NICKNAME_MAX_LENGTH}
          placeholder={defaultName}
          testId="poker-nickname"
          onChange={(detail) => setValue(detail.value)}
          onKeyPress={({ key }) => key === 'Enter' && save()}
        />
      </GoabFormItem>
      <GoabButton type="secondary" size="compact" disabled={!canSave} testId="poker-save-nickname" onClick={save}>
        Save
      </GoabButton>
    </NicknameRow>
  );
};

const NicknameRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--goa-space-s);

  > :first-child {
    flex: 1 1 auto;
    min-width: 0;
  }
`;
