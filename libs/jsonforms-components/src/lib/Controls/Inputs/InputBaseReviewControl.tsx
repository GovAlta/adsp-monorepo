import { CellProps, WithClassname, ControlProps } from '@jsonforms/core';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
export type WithBaseInputReviewProps = CellProps & WithClassname & WithInputProps;
import { withJsonFormsControlProps } from '@jsonforms/react';

export const GoABaseInputReviewComponent = (props: WithBaseInputReviewProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, id } = props;
  return <div data-testid={`review-control-${id}`}>{data}</div>;
};
export const GoInputBaseReview = (props: ControlProps) => (
  <GoAInputBaseControl {...props} input={GoABaseInputReviewComponent} isStepperReview={true} />
);

export const GoInputBaseReviewControl = withJsonFormsControlProps(GoInputBaseReview);
