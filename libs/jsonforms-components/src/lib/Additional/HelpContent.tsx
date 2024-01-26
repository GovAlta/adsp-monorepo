import React from 'react';
import { LabelProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLabelProps } from '@jsonforms/react';
import { GoADetails } from '@abgov/react-components-new';

export const HelpContent = (props: LabelProps): JSX.Element => {
  // eslint-disable-next-line

  const { uischema } = props;

  return (
    <div aria-label={uischema.options?.ariaLabel}>
      <h4>{uischema?.options?.label}</h4>
      {typeof uischema?.options?.help === 'string' && <p>{uischema?.options?.help}</p>}
      {(!uischema.options?.variant || uischema.options?.variant !== 'details') &&
        typeof uischema?.options?.help?.content === 'string' && <p>{uischema?.options?.help?.content}</p>}

      {uischema.options?.variant &&
        uischema.options?.variant === 'details' &&
        typeof uischema?.options?.help === 'object' && (
          <GoADetails heading={uischema?.options?.help?.label}>
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

export default withJsonFormsLabelProps(HelpContent);
