// clean-code-ignore: RULE-19 — covered by ./StepInfoPanel.spec.tsx.
import { GoabCallout, GoabTable, GoabText } from '@abgov/react-components';
import type { StepInfo } from '@abgov/jsonforms-components';
import styled from 'styled-components';

export interface StepLogEntry {
  at: string;
  stepInfo: StepInfo;
}

export const describeStep = (stepInfo?: StepInfo): string => {
  if (!stepInfo) {
    return 'not reported yet';
  }
  if (stepInfo.isOnTaskList) {
    return 'on the application overview';
  }
  if (stepInfo.isOnReview) {
    return 'on the review page';
  }

  const position = [stepInfo.isFirstStep && 'first', stepInfo.isLastStep && 'last'].filter(Boolean).join(' and ');
  return `step ${stepInfo.currentStep}${position ? ` (${position} step)` : ''}`;
};

// Host code outside the form container: it sees only what onStepChange reported.
export const StepInfoPanel = ({ stepInfo, stepLog }: { stepInfo?: StepInfo; stepLog: StepLogEntry[] }): JSX.Element => (
  <div data-testid="step-info-panel">
    <h3>Outside the form container</h3>
    <div data-testid="current-step">
      <GoabText size="body-m" mb="m">
        Current step reported by <code>onStepChange</code>: <strong>{describeStep(stepInfo)}</strong>
      </GoabText>
    </div>
    {stepInfo?.isLastStep && (
      <GoabCallout type="success" mb="m" testId="last-step-hint">
        The host can react to the step - here, a hint that the next page is the review.
      </GoabCallout>
    )}

    <h4>onStepChange calls</h4>
    <GoabTable width="100%" mb="l">
      <thead>
        <tr>
          <th>Time</th>
          <th>currentStep</th>
          <th>isFirstStep</th>
          <th>isLastStep</th>
          <th>isOnReview</th>
          <th>isOnTaskList</th>
        </tr>
      </thead>
      <tbody>
        {stepLog.map(({ at, stepInfo: info }, index) => (
          <tr key={`${at}-${index}`} data-testid="step-change-log-row">
            <td>{at}</td>
            <td>{info.currentStep}</td>
            <td>{String(info.isFirstStep)}</td>
            <td>{String(info.isLastStep)}</td>
            <td>{String(info.isOnReview)}</td>
            <td>{String(info.isOnTaskList)}</td>
          </tr>
        ))}
      </tbody>
    </GoabTable>
  </div>
);

export const FormContainer = styled.div`
  position: relative;
  border: 2px dashed var(--goa-color-greyscale-400);
  border-radius: var(--goa-border-radius-m);
  padding: var(--goa-space-xl) var(--goa-space-l) var(--goa-space-l);
  margin-bottom: var(--goa-space-l);

  &::before {
    content: 'Form container';
    position: absolute;
    top: calc(-1 * var(--goa-space-s));
    left: var(--goa-space-m);
    padding: 0 var(--goa-space-2xs);
    background: var(--goa-color-greyscale-white);
    color: var(--goa-color-text-secondary);
    font-size: var(--goa-font-size-2);
  }
`;
