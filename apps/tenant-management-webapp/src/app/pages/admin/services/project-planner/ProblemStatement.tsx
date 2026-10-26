import React, { FunctionComponent } from 'react';
import { GoabButton, GoabFormItem, GoabTextArea } from '@abgov/react-components';

// Matches the project-planner-service's problemStatement length validation.
export const PROBLEM_STATEMENT_MAX_LENGTH = 100000;

interface ProblemStatementProps {
  value: string;
  busy: boolean;
  continueLabel?: string;
  showContinue?: boolean;
  onChange: (value: string) => void;
  onContinue: () => void;
}

export const ProblemStatement: FunctionComponent<ProblemStatementProps> = ({
  value,
  busy,
  continueLabel = 'Continue',
  showContinue = true,
  onChange,
  onContinue,
}) => {
  const overLimit = value.length > PROBLEM_STATEMENT_MAX_LENGTH;
  return (
    <div data-testid="problem-statement">
      <GoabFormItem
        label="Describe the problem"
        maxWidth="100%"
        mb="m"
        error={
          overLimit
            ? `Problem statement is too long; shorten it to ${PROBLEM_STATEMENT_MAX_LENGTH.toLocaleString()} characters or fewer.`
            : undefined
        }
      >
        <GoabTextArea
          name="problemStatement"
          value={value}
          rows={5}
          width="100%"
          maxWidth="100%"
          testId="problem-input"
          disabled={busy}
          countBy="character"
          maxCount={PROBLEM_STATEMENT_MAX_LENGTH}
          placeholder="Describe who uses the service, the steps they take, the decisions made, and any documents or notifications involved."
          onChange={(detail) => onChange(detail.value)}
        />
      </GoabFormItem>
      {showContinue && (
        <GoabButton
          type="primary"
          testId="problem-continue"
          disabled={busy || !value.trim() || overLimit}
          onClick={onContinue}
        >
          {continueLabel}
        </GoabButton>
      )}
    </div>
  );
};

export default ProblemStatement;
