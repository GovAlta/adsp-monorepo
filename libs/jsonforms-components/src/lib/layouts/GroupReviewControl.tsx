import React from 'react';
import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { GoAGroupControlComponent } from './GroupControl';

export const GoAGroupReviewControlComponent = (props: LayoutProps): JSX.Element => {
  return <GoAGroupControlComponent {...props} isStepperReview={true} />;
};

export const GoAGroupReviewLayoutTester: RankedTester = rankWith(1, uiTypeIs('Group'));

export const GoAGroupReviewControl = withJsonFormsLayoutProps(GoAGroupReviewControlComponent, true);
