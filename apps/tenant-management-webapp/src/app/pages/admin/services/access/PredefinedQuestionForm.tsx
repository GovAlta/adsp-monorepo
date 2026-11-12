import React, { FunctionComponent, useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabFormItem, GoabInput } from '@abgov/react-components';
import type { GoabInputOnChangeDetail, GoabInputOnKeyPressDetail } from '@abgov/ui-components-common';
import styled from 'styled-components';
import { fillQuestionTemplate, findMissingInputs, TemplatedQuestion } from './predefinedQuestion';

interface PredefinedQuestionFormProps {
  question: TemplatedQuestion;
  disabled?: boolean;
  onAsk: (question: string) => void;
  onCancel: () => void;
}

/**
 * Asks for the names a predefined question needs before it is sent, so the agent does not spend a turn asking for
 * them.
 */
export const PredefinedQuestionForm: FunctionComponent<PredefinedQuestionFormProps> = ({
  question,
  disabled = false,
  onAsk,
  onCancel,
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ask = (latestValues: Record<string, string>) => {
    const missing = findMissingInputs(question.inputs, latestValues);
    setErrors(missing);
    if (Object.keys(missing).length === 0) {
      onAsk(fillQuestionTemplate(question.template, latestValues));
    }
  };

  const handleChange = ({ name, value }: GoabInputOnChangeDetail) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  // The key press carries the input's value, which can be newer than the last change event.
  const handleKeyPress = ({ name, value, key }: GoabInputOnKeyPressDetail) => {
    if (key === 'Enter' && !disabled) {
      ask({ ...values, [name]: value });
    } else if (key === 'Escape') {
      onCancel();
    }
  };

  return (
    <FormPanel data-testid="predefined-question-form">
      <strong>{question.label}</strong>
      {question.inputs.map((input, index) => (
        <GoabFormItem
          key={input.name}
          label={input.label}
          requirement="required"
          error={errors[input.name]}
          mt="xs"
          mb="none"
        >
          <GoabInput
            name={input.name}
            size="compact"
            width="100%"
            value={values[input.name] ?? ''}
            placeholder={input.placeholder}
            focused={index === 0}
            error={Boolean(errors[input.name])}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            testId={`predefined-question-input-${input.name}`}
          />
        </GoabFormItem>
      ))}
      <GoabButtonGroup alignment="start" gap="compact" mt="s">
        <GoabButton
          size="compact"
          type="primary"
          disabled={disabled}
          onClick={() => ask(values)}
          testId="predefined-question-ask"
        >
          Ask
        </GoabButton>
        <GoabButton size="compact" type="tertiary" onClick={onCancel} testId="predefined-question-cancel">
          Cancel
        </GoabButton>
      </GoabButtonGroup>
    </FormPanel>
  );
};

const FormPanel = styled.div`
  padding: var(--goa-space-s);
  border: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-s);
  background-color: var(--goa-color-greyscale-white);
  font-size: var(--goa-font-size-2);
`;
