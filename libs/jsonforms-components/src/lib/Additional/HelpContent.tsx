import React from 'react';
import { RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';

import { GoADetails } from '@abgov/react-components-new';

export interface LabelProps {
  uischema: {
    label?: string;
    options?: {
      ariaLabel?: string;
      help?: string | { content?: string | string[]; variant?: string };
      variant?: string;
    };
  };
}

export const HelpContent = (props: LabelProps): JSX.Element => {
  // eslint-disable-next-line

  const { uischema } = props;

  return (
    <div aria-label={uischema.options?.ariaLabel}>
      <h4>{uischema?.label}</h4>
      {typeof uischema?.options?.help === 'string' && <p>{uischema?.options?.help}</p>}
      {(!uischema.options?.variant || uischema.options?.variant !== 'details') &&
        typeof uischema?.options?.help === 'string' && <p>{uischema?.options?.help}</p>}

      {uischema.options?.variant &&
        uischema.options?.variant === 'details' &&
        typeof uischema?.options?.help === 'object' && (
          <GoADetails heading={uischema?.label ? uischema?.label : ''}>
            {Array.isArray(uischema?.options?.help?.content) ? (
              <ul>
                {uischema?.options?.help?.content.map((line: string, index: number) => (
                  <li key={index}>{`${line}`}</li>
                ))}
              </ul>
            ) : (
              uischema?.options?.help?.content
            )}
          </GoADetails>
        )}
    </div>
  );
};
export const HelpContentTester: RankedTester = rankWith(1, uiTypeIs('HelpContent'));
