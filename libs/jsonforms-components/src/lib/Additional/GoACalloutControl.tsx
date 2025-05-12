import React from 'react';
import { JsonFormsProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsRendererProps } from '@jsonforms/react';
import { GoACallout, GoACalloutSize, GoACalloutType } from '@abgov/react-components';

export interface CalloutProps {
  size?: GoACalloutSize;
  type?: GoACalloutType;
  message?: string;
}

// Used locally for callout presentation
export const callout = (props: CalloutProps): JSX.Element => {
  const componentProps: CalloutProps = {
    size: 'medium',
    type: 'emergency',
    message: 'unknown',
    ...props,
  };
  const testid = componentProps.message?.replace(/\s/g, '');
  return (
    <GoACallout {...componentProps} data-testid={testid}>
      {componentProps.message}
    </GoACallout>
  );
};

const CalloutControl = (props: JsonFormsProps) => {
  return callout(props?.uischema?.options?.componentProps || {});
};

export const CalloutReviewControl = () => {
  return <></>;
};

export const GoACalloutControlTester: RankedTester = rankWith(1, uiTypeIs('Callout'));

export default withJsonFormsRendererProps(CalloutControl);
