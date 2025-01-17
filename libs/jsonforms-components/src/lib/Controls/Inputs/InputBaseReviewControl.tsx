import { CellProps, WithClassname, ControlProps, StatePropsOfControl } from '@jsonforms/core';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAIcon } from '@abgov/react-components-new';
import { RequiredTextLabel, WarningIconDiv } from './style-component';

export type WithBaseInputReviewProps = CellProps & WithClassname & WithInputProps & StatePropsOfControl;

const warningIcon = (errorMessage: string) => {
  return (
    <WarningIconDiv>
      <GoAIcon type="warning" size="small" theme="filled" mt="2xs"></GoAIcon>
      {errorMessage}
    </WarningIconDiv>
  );
};
export const GoABaseInputReviewComponent = (props: WithBaseInputReviewProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, id, uischema, schema, required } = props;
  let reviewText = data;
  const isBoolean = typeof data === 'boolean';
  const requiredText = `${
    uischema?.options?.text ? uischema?.options?.text : schema?.title ? schema?.title : schema?.description
  }${required ? ' is required.' : ''}`;

  const requiredLabel =
    data !== undefined && schema.type === 'boolean' && required ? (
      <RequiredTextLabel>{` (required)`}</RequiredTextLabel>
    ) : null;

  if (isBoolean) {
    const label = uischema.options?.text?.trim();

    if (uischema.options?.radio === true) {
      reviewText = data ? `Yes` : `No`;
    } else {
      reviewText = data ? `Yes (${label})` : `No (${label})`;
    }
  }

  const renderWarningMessage = () => {
    if (uischema.options?.radio) return null;

    if (schema.type === 'boolean' && required && data === undefined) {
      return warningIcon(requiredText.trim());
    }

    return null;
  };

  return (
    <div style={{ textWrap: 'wrap', wordBreak: 'break-word' }} data-testid={`review-control-${id}`}>
      {reviewText}
      {requiredLabel}
      {renderWarningMessage()}
    </div>
  );
};
export const GoInputBaseReview = (props: ControlProps) => (
  <GoAInputBaseControl {...props} input={GoABaseInputReviewComponent} isStepperReview={true} />
);

export const GoInputBaseReviewControl = withJsonFormsControlProps(GoInputBaseReview);
