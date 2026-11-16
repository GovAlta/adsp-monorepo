import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonformsStepChange, stepChangeUiSchema } from './JsonformsStepChange';
import { describeStep } from './StepInfoPanel';

interface StepInfoLike {
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStep: number;
  isOnReview: boolean;
  isOnTaskList: boolean;
}

const wiring: { onStepChange?: (stepInfo: StepInfoLike) => void; uischema?: { options: Record<string, unknown> } } = {};

jest.mock('@abgov/jsonforms-components', () => ({
  ContextProviderFactory:
    () =>
    ({ children, onStepChange }: { children: React.ReactNode; onStepChange?: (stepInfo: StepInfoLike) => void }) => {
      wiring.onStepChange = onStepChange;
      return <div>{children}</div>;
    },
  createDefaultAjv: () => ({}),
  useStepChange: (listener?: (stepInfo: StepInfoLike) => void) => {
    const [stepInfo, setStepInfo] = jest.requireActual('react').useState();
    return {
      stepInfo,
      onStepChange: (next: StepInfoLike) => {
        setStepInfo(next);
        listener?.(next);
      },
    };
  },
  GoARenderers: [],
  GoACells: [],
}));

jest.mock('@jsonforms/react', () => ({
  JsonForms: ({ uischema }: { uischema: { options: Record<string, unknown> } }) => {
    wiring.uischema = uischema;
    return <div data-testid="json-forms" />;
  },
}));

jest.mock('../../styled-components', () => ({
  ServiceContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@abgov/react-components', () => ({
  GoabContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  GoabCallout: ({ children, testId }: { children: React.ReactNode; testId?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  GoabButtonGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabTable: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  GoabButton: ({ children, testId, onClick }: { children: React.ReactNode; testId: string; onClick: () => void }) => (
    <button data-testid={testId} onClick={onClick}>
      {children}
    </button>
  ),
}));

const stepInfo = (overrides: Partial<StepInfoLike>): StepInfoLike => ({
  isFirstStep: false,
  isLastStep: false,
  currentStep: 0,
  isOnReview: false,
  isOnTaskList: false,
  ...overrides,
});

describe('JsonformsStepChange', () => {
  beforeEach(() => {
    wiring.onStepChange = undefined;
    wiring.uischema = undefined;
  });

  it('shows nothing reported until the form reports a step', () => {
    render(<JsonformsStepChange />);

    expect(screen.getByTestId('current-step')).toHaveTextContent('not reported yet');
    expect(screen.queryAllByTestId('step-change-log-row')).toHaveLength(0);
  });

  it('logs every onStepChange call, newest first', () => {
    render(<JsonformsStepChange />);

    act(() => {
      wiring.onStepChange?.(stepInfo({ currentStep: 1, isFirstStep: true }));
    });
    act(() => {
      wiring.onStepChange?.(stepInfo({ currentStep: 2 }));
    });

    const rows = screen.getAllByTestId('step-change-log-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('2falsefalsefalsefalse');
    expect(rows[1]).toHaveTextContent('1truefalsefalsefalse');
    expect(screen.getByTestId('current-step')).toHaveTextContent('step 2');
  });

  it('shows the last-step hint only on the last step', () => {
    render(<JsonformsStepChange />);
    expect(screen.queryByTestId('last-step-hint')).not.toBeInTheDocument();

    act(() => {
      wiring.onStepChange?.(stepInfo({ currentStep: 3, isLastStep: true }));
    });

    expect(screen.getByTestId('last-step-hint')).toBeInTheDocument();
  });

  it('renders the form as a plain Categorization with no variant', () => {
    render(<JsonformsStepChange />);

    expect(wiring.uischema?.options).not.toHaveProperty('variant');
  });

  it('renders the form inside its container and the step display outside it', () => {
    render(<JsonformsStepChange />);
    act(() => {
      wiring.onStepChange?.(stepInfo({ currentStep: 1, isFirstStep: true }));
    });

    const container = screen.getByTestId('step-change-form-container');
    expect(container).toContainElement(screen.getByTestId('json-forms'));
    expect(container).not.toContainElement(screen.getByTestId('current-step'));
    expect(screen.getByTestId('step-info-panel')).toHaveTextContent('step 1 (first step)');
  });

  it('shows a usage example that wires onStepChange', () => {
    render(<JsonformsStepChange />);

    expect(screen.getByTestId('step-change-usage')).toHaveTextContent('onStepChange={onStepChange}');
  });
});

describe('describeStep', () => {
  it.each([
    [undefined, 'not reported yet'],
    [stepInfo({ isOnTaskList: true }), 'on the application overview'],
    [stepInfo({ isOnReview: true }), 'on the review page'],
    [stepInfo({ currentStep: 1, isFirstStep: true }), 'step 1 (first step)'],
    [stepInfo({ currentStep: 2 }), 'step 2'],
    [stepInfo({ currentStep: 4, isLastStep: true }), 'step 4 (last step)'],
    [stepInfo({ currentStep: 1, isFirstStep: true, isLastStep: true }), 'step 1 (first and last step)'],
  ])('describes %o as "%s"', (reported, expected) => {
    expect(describeStep(reported)).toBe(expected);
  });
});

describe('stepChangeUiSchema', () => {
  it('only shows the representative details page when there is a representative', () => {
    const details = stepChangeUiSchema.elements[2];

    expect(details.label).toBe('Representative details');
    expect(details.rule).toEqual({
      effect: 'SHOW',
      condition: { scope: '#/properties/hasRepresentative', schema: { const: 'Yes' } },
    });
  });
});
