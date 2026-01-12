import React from 'react';
import { GoabIcon } from '@abgov/react-components';

import { HelpText, ErrorMsg } from './styled-components';

interface HelpTextProps {
  length: number;
  maxLength: number;
  descErrMessage: string;
  errorMsg?: string;
}

export const HelpTextComponent: React.FC<HelpTextProps> = ({ length, maxLength, descErrMessage, errorMsg }) => (
  <HelpText>
    {length <= maxLength ? (
      <div>{descErrMessage}</div>
    ) : (
      <ErrorMsg>
        <GoabIcon type="warning" size="small" theme="filled" ariaLabel="warning" />
        {`  ${errorMsg}`}
      </ErrorMsg>
    )}
    <div>{`${length}/${maxLength}`}</div>
  </HelpText>
);
