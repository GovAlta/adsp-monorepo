import React from 'react';
import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { Hidden } from '@mui/material';
import { GoADetails } from '@abgov/react-components-new';
import { ControlProps } from '@jsonforms/core';

export interface LabelProps {
  uischema: {
    label?: string;
    options?: {
      ariaLabel?: string;
      help?: string | string[];
      variant?: string;
    };
  };
}

export const HelpContent = (props: ControlProps & LabelProps): JSX.Element => {
  // eslint-disable-next-line

  const { uischema, visible } = props;

  const renderHelp = () =>
    Array.isArray(uischema?.options?.help) ? (
      <ul>
        {uischema?.options?.help.map((line: string, index: number) => (
          <li key={index}>{`${line}`}</li>
        ))}
      </ul>
    ) : (
      uischema?.options?.help
    );

  return (
    <Hidden xsUp={!visible}>
      <div aria-label={uischema.options?.ariaLabel}>
        {!uischema.options?.variant && uischema.options?.variant !== 'details' && <h4>{uischema?.label}</h4>}
        {(!uischema.options?.variant || uischema.options?.variant !== 'details') && renderHelp()}
        {uischema.options?.variant && uischema.options?.variant === 'details' && (
          <GoADetails heading={uischema.label ? uischema.label : ''}>{renderHelp()}</GoADetails>
        )}
      </div>
    </Hidden>
  );
};
export const HelpContentTester: RankedTester = rankWith(1, uiTypeIs('HelpContent'));
