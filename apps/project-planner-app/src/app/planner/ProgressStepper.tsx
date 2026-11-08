import React, { FunctionComponent } from 'react';

export interface ProgressStepDefinition {
  id: 1 | 2 | 3;
  label: string;
  complete: boolean;
}

interface ProgressStepperProps {
  steps: ProgressStepDefinition[];
  activeId: 1 | 2 | 3;
  onSelect: (id: 1 | 2 | 3) => void;
}

const circleStyle = (reached: boolean, active: boolean): React.CSSProperties => {
  const size = active ? 40 : 32;
  return {
    alignItems: 'center',
    background: reached ? 'var(--goa-color-interactive-default)' : 'var(--goa-color-greyscale-white)',
    border: `var(--goa-border-width-m, 2px) solid ${
      reached ? 'var(--goa-color-interactive-default)' : 'var(--goa-color-greyscale-400)'
    }`,
    borderRadius: '50%',
    color: reached ? 'var(--goa-color-greyscale-white)' : 'var(--goa-color-text-secondary)',
    display: 'flex',
    flexShrink: 0,
    fontSize: 'var(--goa-font-size-3)',
    fontWeight: 'var(--goa-font-weight-bold, 700)',
    height: size,
    justifyContent: 'center',
    outline: active ? '3px solid var(--goa-color-interactive-default)' : 'none',
    outlineOffset: 3,
    transition: 'height 0.15s ease, width 0.15s ease',
    width: size,
  };
};

export const ProgressStepper: FunctionComponent<ProgressStepperProps> = ({ steps, activeId, onSelect }) => (
  <nav
    aria-label="Project planning progress"
    data-testid="solution-progress-stepper"
    style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}
  >
    {steps.map((step, index) => {
      const active = step.id === activeId;
      const reached = active || step.complete;
      return (
        <React.Fragment key={step.id}>
          {index > 0 && (
            <div
              aria-hidden="true"
              style={{
                background: steps[index - 1].complete
                  ? 'var(--goa-color-interactive-default)'
                  : 'var(--goa-color-greyscale-200)',
                flex: 1,
                width: 'var(--goa-border-width-m, 2px)',
                margin: '0.5rem 0',
              }}
            />
          )}
          <button
            type="button"
            data-testid={`progress-step-${step.id}`}
            aria-current={active ? 'step' : undefined}
            aria-label={`Go to step ${step.id}: ${step.label}`}
            onClick={() => onSelect(step.id)}
            style={{ background: 'none', border: 0, cursor: 'pointer', flexShrink: 0, padding: 0 }}
          >
            <span style={circleStyle(reached, active)}>{step.id}</span>
          </button>
        </React.Fragment>
      );
    })}
  </nav>
);

export default ProgressStepper;
