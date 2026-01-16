import React from 'react';
import { ControlProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoabCallout } from '@abgov/react-components';
import { Visible } from '../util';
import { GoabCalloutSize, GoabCalloutType } from '@abgov/ui-components-common';
export interface CalloutProps {
  size?: GoabCalloutSize;
  type?: GoabCalloutType;
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
    <GoabCallout {...componentProps} data-testid={testid}>
      {componentProps?.message}
    </GoabCallout>
  );
};
const GoACalloutController = (props: ControlProps) => {
  const { uischema, visible, data } = props;

  let showCallout: boolean;

  /* istanbul ignore next */
  if (data === undefined || (Array.isArray(data) && data.length === 0)) {
    showCallout = false;
  } else {
    showCallout = visible === true;
  }

  const calloutProps = uischema?.options?.componentProps || {};

  return <Visible visible={showCallout}>{callout(calloutProps)}</Visible>;
};

/* istanbul ignore next */
export const CalloutReviewControl = () => {
  //eslint-disable-next-line
  return <></>;
};

export const GoACalloutControlTester: RankedTester = rankWith(1, uiTypeIs('Callout'));
export const GoACalloutControl = withJsonFormsControlProps(GoACalloutController);
export default GoACalloutControl;
