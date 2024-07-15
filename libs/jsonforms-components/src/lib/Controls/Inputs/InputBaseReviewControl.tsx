import { CellProps, WithClassname, ControlProps } from '@jsonforms/core';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { withJsonFormsControlProps } from '@jsonforms/react';
export type WithBaseInputReviewProps = CellProps & WithClassname & WithInputProps;

export const GoABaseInputReviewComponent = (props: WithBaseInputReviewProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, id } = props;
  let reviewText = data;
  const isBoolean = typeof data === 'boolean';
  if (isBoolean) {
    reviewText = data ? 'Yes' : 'No';
  }

  return <div data-testid={`review-control-${id}`}>{reviewText}</div>;
};
export const GoInputBaseReview = (props: ControlProps) => (
  <GoAInputBaseControl {...props} input={GoABaseInputReviewComponent} isStepperReview={true} />
);

export const GoInputBaseReviewControl = withJsonFormsControlProps(GoInputBaseReview);
