import { GoabBadge, GoabDetails } from '@abgov/react-components';
import type { ToolCall } from '@core-services/app-common';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { GenerationProgress, GenerationStep, isFormGenerationTool, readGenerationProgress } from './formGeneration';

interface FormGenerationToolCallProps {
  toolCall: ToolCall;
}

const MAX_ERROR_CHARS = 2048;
const SWEEP_PASS = 2;

export const FormGenerationToolCall: FunctionComponent<FormGenerationToolCallProps> = ({ toolCall }) => {
  if (!isFormGenerationTool(toolCall.toolName)) {
    return null;
  }

  const progress = readGenerationProgress(toolCall.progress);
  const finished = Boolean(toolCall.result) || Boolean(toolCall.error) || progress.done;
  const failed = Boolean(toolCall.error) || progress.failures.length > 0;

  return (
    <GenerationCall
      data-status={!finished ? 'pending' : failed ? 'error' : 'complete'}
      data-testid="form-generation-tool"
    >
      {/* The body must be one stable child: goa-details only slots nodes that exist when it mounts. */}
      <GoabDetails heading={heading(progress, finished, failed)} open={!finished}>
        <div>
          {progress.reason && <p>{progress.reason}</p>}
          <ol data-testid="form-generation-steps">
            {progress.steps.map((step) => (
              <StepRow key={step.index} data-step-status={step.status}>
                {stepText(step)}
              </StepRow>
            ))}
          </ol>
          {progress.validation && (
            <GoabBadge
              type={progress.validation.ok ? 'success' : 'emergency'}
              content={progress.validation.ok ? 'Valid' : 'Validation issues'}
            />
          )}
          {progress.recovered.length > 0 && (
            <p>Rebuilt on a second pass after failing at first: {progress.recovered.join(', ')}.</p>
          )}
          {progress.failures.map((failure) => (
            <p key={failure.index}>
              Could not build “{failure.label}”: {failure.message}
            </p>
          ))}
          {progress.notAttempted.length > 0 && (
            <p>The run stopped before reaching: {progress.notAttempted.join(', ')}. Nothing was built for those.</p>
          )}
          {toolCall.error != null && <pre>{truncate(toolCall.error)}</pre>}
        </div>
      </GoabDetails>
    </GenerationCall>
  );
};

function heading(progress: GenerationProgress, finished: boolean, failed: boolean): string {
  if (!progress.total) {
    return finished ? 'Form generation finished' : 'Planning the form…';
  }

  const counts = `${progress.saved}/${progress.total}`;
  if (!finished) {
    const active = progress.steps.find((step) => step.status === 'running' || step.status === 'retrying');
    if (!active) {
      return `Building ${counts}`;
    }
    return `${active.pass === SWEEP_PASS ? 'Rebuilding' : 'Building'} ${counts} — ${active.label}`;
  }

  return failed ? `Built ${counts} steps, with issues` : `Built ${counts} steps`;
}

function stepText(step: GenerationStep): string {
  return `${step.label}${step.type !== 'category' ? ` (${step.type})` : ''}${stepSuffix(step)}`;
}

function stepSuffix(step: GenerationStep): string {
  switch (step.status) {
    case 'running':
      return ' — building';
    case 'retrying':
      // The sweep restarts the attempt count, so showing the number there reads like the run went backwards.
      return step.pass === SWEEP_PASS
        ? ' — rebuilding now the other pages exist'
        : ` — retrying (attempt ${step.attempt})`;
    case 'failed':
      return ' — failed';
    default:
      return '';
  }
}

function truncate(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  return json.length > MAX_ERROR_CHARS ? `${json.slice(0, MAX_ERROR_CHARS)}\n… truncated` : json;
}

const GenerationCall = styled.div`
  margin: 0 var(--goa-space-xl) var(--goa-space-l) var(--goa-space-xl);

  &[data-status='error'] {
    border-left: 3px solid var(--goa-color-emergency-default);
  }

  &[data-status='complete'] {
    border-left: 3px solid var(--goa-color-success-default);
  }

  & ol {
    margin: 0;
    padding-left: var(--goa-space-l);
    font-size: var(--goa-font-size-1);
  }

  & pre {
    background: var(--goa-color-greyscale-100);
    white-space: pre-wrap;
    font-family: monospace;
    font-size: var(--goa-font-size-1);
    padding: var(--goa-space-m);
    max-height: 250px;
    overflow: auto;
  }
`;

const StepRow = styled.li`
  &[data-step-status='pending'] {
    color: var(--goa-color-text-secondary);
  }

  &[data-step-status='failed'] {
    color: var(--goa-color-emergency-default);
  }

  &[data-step-status='saved'] {
    color: var(--goa-color-text-default);
  }
`;
