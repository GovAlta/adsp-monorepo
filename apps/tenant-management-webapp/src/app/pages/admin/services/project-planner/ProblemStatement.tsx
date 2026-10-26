import React, { FunctionComponent } from 'react';
import { GoabButton, GoabFormItem, GoabTextArea } from '@abgov/react-components';

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
  return (
    <div data-testid="problem-statement">
      <GoabFormItem label="Describe the problem" maxWidth="100%" mb="m">
        <GoabTextArea
          name="problemStatement"
          value={value}
          rows={5}
          width="100%"
          maxWidth="100%"
          testId="problem-input"
          disabled={busy}
          placeholder="Describe who uses the service, the steps they take, the decisions made, and any documents or notifications involved."
          onChange={(detail) => onChange(detail.value)}
        />
      </GoabFormItem>
      {showContinue && (
        <GoabButton type="primary" testId="problem-continue" disabled={busy || !value.trim()} onClick={onContinue}>
          {continueLabel}
        </GoabButton>
      )}
    </div>
  );
};

export default ProblemStatement;
