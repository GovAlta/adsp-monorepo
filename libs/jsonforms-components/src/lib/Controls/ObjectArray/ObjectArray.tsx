import React from 'react';
import {
  ArrayLayoutProps,
  RankedTester,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
  ControlProps,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ObjectArrayControl } from './ObjectListControl';
import { Visible } from '../../util';

export type CombinedProps = ControlProps & ArrayLayoutProps;

export const ArrayControl = (props: CombinedProps) => {
  const { visible, handleChange } = props;

  return (
    <Visible visible={visible}>
      <ObjectArrayControl {...props} handleChange={handleChange} />
    </Visible>
  );
};

export const GoAArrayControlTester: RankedTester = rankWith(3, or(isObjectArrayControl, isPrimitiveArrayControl));

export const ArrayControlBase = (props: ControlProps) => {
  const { visible } = props;
  return (
    <Visible visible={visible}>
      <ArrayControl arraySchema={{}} {...props} addItem={() => () => { } } />
    </Visible>
  );
};

export const ArrayControlReview = (props: ControlProps) => {
  const { visible } = props;

  return (
    <Visible visible={visible}>
      <ObjectArrayControl arraySchema={{}} {...props} addItem={() => () => { } } isStepperReview={true} enabled={true} />
    </Visible>
  );
};

export const GoAArrayControlRenderer = withJsonFormsControlProps(ArrayControlBase);
export const GoAArrayControlReviewRenderer = withJsonFormsControlProps(ArrayControlReview);
