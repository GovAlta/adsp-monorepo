import React from 'react';
import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';

import { GoADetails } from '@abgov/react-components-new';
import { HelpContentDiv } from './styled-components';
export interface LabelProps {
  uischema?: {
    label?: string;
    options?: OptionProps;
    elements?: LabelProps[];
  };
}

interface OptionProps {
  ariaLabel?: string;
  help?: string | string[];
  variant?: string;
}

export const HelpContent = (props: LabelProps): JSX.Element => {
  // eslint-disable-next-line

  const { uischema } = props;
  const renderHelp = () =>
    Array.isArray(uischema?.options?.help) ? (
      <ul>
        {uischema?.options?.help.map((line: string, index: number) => (
          <li key={index}>{`${line}`}</li>
        ))}
      </ul>
    ) : (
      <p className="single-line">{uischema?.options?.help}</p>
    );

  return (
    <HelpContentDiv aria-label={uischema.options?.ariaLabel}>
      {!uischema.options?.variant && uischema.options?.variant !== 'details' && (
        <label className="label">
          {uischema?.label}
          <br />
        </label>
      )}
      {(!uischema.options?.variant || uischema.options?.variant !== 'details') && renderHelp()}
      {uischema.options?.variant && uischema.options?.variant === 'details' && (
        <GoADetails heading={uischema.label ? uischema.label : ''} mt="xs" mb="xs">
          {renderHelp()}
          {uischema?.elements && uischema?.elements.length > 0 && <HelpContents elements={uischema.elements} />}
        </GoADetails>
      )}
      {uischema?.elements && uischema?.elements.length > 0 && uischema.options?.variant !== 'details' && (
        <HelpContents elements={uischema.elements} />
      )}
    </HelpContentDiv>
  );
};
export const HelpContents = ({ elements }: any) => (
  <div>
    {elements?.map((labelProps: any) => {
      return <HelpContent uischema={labelProps} />;
    })}
  </div>
);

export const HelpContentTester: RankedTester = rankWith(1, uiTypeIs('HelpContent'));
