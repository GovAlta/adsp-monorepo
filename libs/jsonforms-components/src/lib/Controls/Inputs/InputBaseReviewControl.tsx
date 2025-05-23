import { CellProps, WithClassname, ControlProps, StatePropsOfControl } from '@jsonforms/core';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAIcon } from '@abgov/react-components';
import { RequiredTextLabel, WarningIconDiv } from './style-component';
import { convertToSentenceCase, getLastSegmentFromPointer, to12HourFormat, UTCToFullLocalTime } from '../../util';

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
  const isTime = schema?.type === 'string' && schema?.format === 'time';
  const isDateTime = schema?.type === 'string' && schema?.format === 'date-time';

  const getRequiredLabelText = () => {
    let label = '';
    if (uischema?.options?.text) {
      label = uischema?.options?.text;
    } else if (schema?.title) {
      label = schema?.title;
    } else if (schema?.description) {
      label = schema?.description;
    } else if (uischema?.label) {
      label = (uischema?.label as string) || '';
    }
    return `${label} ${required ? 'is required' : ''}`;
  };

  const renderRequiredLabel = () => {
    if (label !== '' && uischema.options?.text !== '') return null;

    return data !== undefined && schema.type === 'boolean' && required ? (
      <RequiredTextLabel>{` (required)`}</RequiredTextLabel>
    ) : null;
  };

  const requiredText = getRequiredLabelText();

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
      reviewText = data ? `Yes (${checkboxLabel.trim()})` : `No (${checkboxLabel.trim()})`;
    }
  }

  if (isTime) {
    reviewText = reviewText && to12HourFormat(reviewText);
  }

  if (isDateTime) {
    reviewText = reviewText && UTCToFullLocalTime(reviewText);
  }

  if (Array.isArray(data) && data.length > 0) {
    reviewText = (
      <ul>
        {data.map((checkbox: string, index: number) => {
          const checkboxLabel =
            uischema?.options?.text?.trim() || convertToSentenceCase(getLastSegmentFromPointer(uischema.scope));
          return <li key={index}>{checkbox.trim() || checkboxLabel.trim()}</li>;
        })}
      </ul>
    );
  }

  return (
    <div style={{ fontWeight: '400', textWrap: 'wrap', wordBreak: 'break-word' }} data-testid={`review-control-${id}`}>
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
