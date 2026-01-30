import { CellProps, WithClassname, ControlProps, StatePropsOfControl } from '@jsonforms/core';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoabIcon } from '@abgov/react-components';
import { RequiredTextLabel, WarningIconDiv } from './style-component';
import { getLastSegmentFromPointer, to12HourFormat, UTCToFullLocalTime } from '../../util';

export type WithBaseInputReviewProps = CellProps & WithClassname & WithInputProps & StatePropsOfControl;

const warningIcon = (errorMessage: string) => {
  return (
    <WarningIconDiv>
      <GoabIcon type="warning" size="small" theme="filled" mt="2xs" ariaLabel="warning"></GoabIcon>
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
    let checkboxLabel = '';

    if (uischema.options?.text?.trim()) {
      checkboxLabel = uischema.options.text.trim();
    } else if (uischema.scope && uischema.scope.startsWith('#/')) {
      const fallbackLabel = getLastSegmentFromPointer(uischema.scope);
      checkboxLabel = fallbackLabel.charAt(0).toUpperCase() + fallbackLabel.slice(1);
    }

    if (uischema.options?.radio === true) {
      reviewText = data ? `Yes` : `No`;
    } else {
      reviewText = data ? `Yes (${checkboxLabel})` : `No (${checkboxLabel})`;
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
          let checkboxLabel = '';

          // Use explicit text if provided, otherwise fall back to property name from scope
          if (uischema?.options?.text?.trim()) {
            checkboxLabel = uischema.options.text.trim();
          } else if (uischema.scope && uischema.scope.startsWith('#/')) {
            const fallbackLabel = getLastSegmentFromPointer(uischema.scope);
            // Capitalize first letter only when falling back to property name from scope
            checkboxLabel = fallbackLabel.charAt(0).toUpperCase() + fallbackLabel.slice(1);
          }

          return <li key={index}>{checkbox.trim() || checkboxLabel}</li>;
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

export const GoAInputBaseReviewControl = withJsonFormsControlProps(GoInputBaseReview);
