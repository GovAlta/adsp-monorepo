import React from 'react';
import { GoAIcon } from '@abgov/react-components';

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
        <GoAIcon type="warning" size="small" theme="filled" ariaLabel="warning" />
        {`  ${errorMsg}`}
      </ErrorMsg>
    )}
    <div>{`${length}/${maxLength}`}</div>
  </HelpText>
);
