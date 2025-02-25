import { CellProps, WithClassname, ControlProps, StatePropsOfControl } from '@jsonforms/core';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAIcon } from '@abgov/react-components';
import { RequiredTextLabel, WarningIconDiv } from './style-component';
import { convertToSentenceCase, getLastSegmentFromPointer } from '../../util';

export type WithBaseInputReviewProps = CellProps & WithClassname & WithInputProps & StatePropsOfControl;

const warningIcon = (errorMessage: string) => {
  return (
    <WarningIconDiv>
      <GoAIcon type="warning" size="small" theme="filled" mt="2xs" ariaLabel="warning"></GoAIcon>
      {errorMessage}
    </WarningIconDiv>
  );
};
export const GoABaseInputReviewComponent = (props: WithBaseInputReviewProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, id, uischema, schema, required, label } = props;
  let reviewText = data;
  const isBoolean = typeof data === 'boolean';
  const requiredText = `${
    uischema?.options?.text ? uischema?.options?.text : schema?.title ? schema?.title : schema?.description
  }${required ? ' is required.' : ''}`;

  const renderRequiredLabel = () => {
    if (label !== '' && uischema.options?.text !== '') return null;

    return data !== undefined && schema.type === 'boolean' && required ? (
      <RequiredTextLabel>{` (required)`}</RequiredTextLabel>
    ) : null;
  };

  const renderWarningMessage = () => {
    if (uischema.options?.radio) return null;

    if (schema.type === 'boolean' && required && (data === undefined || data === false)) {
      return warningIcon(requiredText.trim());
    }

    return null;
  };

  if (isBoolean) {
    const checkboxLabel =
      uischema.options?.text?.trim() || convertToSentenceCase(getLastSegmentFromPointer(uischema.scope));

    if (uischema.options?.radio === true) {
      reviewText = data ? `Yes` : `No`;
    } else {
      if (label !== '' || typeof label === 'boolean') {
        reviewText = data ? `Yes` : `No`;
      } else {
        reviewText = data ? `Yes (${checkboxLabel.trim()})` : `No (${checkboxLabel.trim()})`;
      }
    }
  }

  return (
    <div style={{ textWrap: 'wrap', wordBreak: 'break-word' }} data-testid={`review-control-${id}`}>
      {reviewText}
      {renderRequiredLabel()}
      {renderWarningMessage()}
    </div>
  );
};
export const GoInputBaseReview = (props: ControlProps) => (
  <GoAInputBaseControl
    {...props}
    input={GoABaseInputReviewComponent}
    isStepperReview={true}
    skipInitialValidation={true}
  />
);

export const GoInputBaseReviewControl = withJsonFormsControlProps(GoInputBaseReview);
