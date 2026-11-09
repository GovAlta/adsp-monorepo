import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonformsReviewNavigation } from './JsonformsReviewNavigation';

// Captures what the page hands the two providers, so a Change click and the form's answer can both
// be driven without rendering the form itself.
const wiring: {
  onReviewChange?: (stepId: number | undefined, scope: string) => void;
  navigationTarget?: { pageId?: string; scope?: string };
  onNavigationChange?: (outcome: { status: string; pageId: string }) => void;
  onStepChange?: (stepInfo: StepInfoLike) => void;
} = {};

interface StepInfoLike {
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStep: number;
  isOnReview: boolean;
  isOnTaskList: boolean;
}

jest.mock('@abgov/jsonforms-components', () => ({
  ContextProviderFactory:
    () =>
    ({
      children,
      navigationTarget,
      onNavigationChange,
      onStepChange,
    }: {
      children: React.ReactNode;
      navigationTarget?: { pageId?: string; scope?: string };
      onNavigationChange?: (outcome: { status: string; pageId: string }) => void;
      onStepChange?: (stepInfo: StepInfoLike) => void;
    }) => {
      // The page renders two of these; only the one wrapping the form carries the navigation wiring.
      if (onNavigationChange) {
        wiring.navigationTarget = navigationTarget;
        wiring.onNavigationChange = onNavigationChange;
        wiring.onStepChange = onStepChange;
      }
      return <div>{children}</div>;
    },
  ReviewRenderProvider: ({
    children,
    onReviewChange,
  }: {
    children: React.ReactNode;
    onReviewChange: (stepId: number | undefined, scope: string) => void;
  }) => {
    wiring.onReviewChange = onReviewChange;
    return <div data-testid="review-provider">{children}</div>;
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
  getNavigationTargets: (uischema: { elements: { label?: string }[] }) =>
    uischema.elements.map((element, index) => ({
      pageId: `page-${index + 1}`,
      label: element.label,
      authored: false,
      index,
      fields: [],
    })),
  GoAReviewRenderers: [],
  GoARenderers: [],
  GoACells: [],
}));

const formUiSchemas: { options: Record<string, unknown> }[] = [];

jest.mock('@jsonforms/react', () => ({
  JsonForms: ({ uischema, readonly }: { uischema: { options: Record<string, unknown> }; readonly?: boolean }) => {
    if (!readonly) {
      formUiSchemas.push(uischema);
    }
    return <div data-testid={readonly ? 'json-forms-review' : 'json-forms'} />;
  },
}));

jest.mock('../../styled-components', () => ({
  ServiceContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@abgov/react-components', () => ({
  GoabContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  GoabCallout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabDetails: ({ children }: { children: React.ReactNode }) => <details>{children}</details>,
  GoabButtonGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabTable: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  GoabButton: ({ children, testId, onClick }: { children: React.ReactNode; testId: string; onClick: () => void }) => (
    <button data-testid={testId} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('JsonformsReviewNavigation', () => {
  beforeEach(() => {
    wiring.onReviewChange = undefined;
    wiring.navigationTarget = undefined;
    wiring.onNavigationChange = undefined;
    wiring.onStepChange = undefined;
  });

  it('lists every page the definition lets a host address', () => {
    render(<JsonformsReviewNavigation />);

    expect(screen.getByTestId('navigation-target-page-1')).toHaveTextContent('What is your dispute about?');
    expect(screen.getByTestId('navigation-target-page-12')).toHaveTextContent('What is the desired outcome?');
  });

  it('turns a reported step into a page target for the form', () => {
    render(<JsonformsReviewNavigation />);

    act(() => {
      wiring.onReviewChange?.(2, '#/properties/applicantContactDetails/properties/firstName');
    });

    expect(wiring.navigationTarget).toEqual({
      pageId: 'page-3',
      scope: '#/properties/applicantContactDetails/properties/firstName',
    });
  });

  it('passes a scope on its own when the review reports no step', () => {
    render(<JsonformsReviewNavigation />);

    act(() => {
      wiring.onReviewChange?.(undefined, '#/properties/addSupportingDocuments');
    });

    expect(wiring.navigationTarget).toEqual({ pageId: undefined, scope: '#/properties/addSupportingDocuments' });
  });

  it('clears the target once the form has answered, so the same Change works again', () => {
    render(<JsonformsReviewNavigation />);

    act(() => {
      wiring.onReviewChange?.(2, '#/properties/applicantContactDetails/properties/firstName');
    });
    act(() => {
      wiring.onNavigationChange?.({ status: 'navigated', pageId: 'page-3' });
    });

    expect(wiring.navigationTarget).toBeUndefined();
  });

  it('logs what the review reported and what the form made of it', () => {
    render(<JsonformsReviewNavigation />);

    act(() => {
      wiring.onReviewChange?.(2, '#/properties/applicantContactDetails/properties/firstName');
    });
    act(() => {
      wiring.onNavigationChange?.({ status: 'navigated', pageId: 'page-3' });
    });

    const rows = screen.getAllByTestId('review-change-log-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('#/properties/applicantContactDetails/properties/firstName');
    expect(rows[0]).toHaveTextContent('navigated to page-3');
  });

  it('empties the log when reset', () => {
    render(<JsonformsReviewNavigation />);

    act(() => {
      wiring.onReviewChange?.(0, '#/properties/whichOfThemApplies');
    });
    expect(screen.getAllByTestId('review-change-log-row')).toHaveLength(1);

    fireEvent.click(screen.getByTestId('reset-review-navigation'));

    expect(screen.queryAllByTestId('review-change-log-row')).toHaveLength(0);
  });

  describe('current step', () => {
    const stepInfo = (overrides: Partial<StepInfoLike>): StepInfoLike => ({
      isFirstStep: false,
      isLastStep: false,
      currentStep: 0,
      isOnReview: false,
      isOnTaskList: false,
      ...overrides,
    });

    it('shows nothing reported until the form reports a step', () => {
      render(<JsonformsReviewNavigation />);

      expect(screen.getByTestId('current-step')).toHaveTextContent('not reported yet');
    });

    it.each([
      [stepInfo({ isOnTaskList: true }), 'on the application overview'],
      [stepInfo({ currentStep: 1, isFirstStep: true }), 'step 1 (first step)'],
      [stepInfo({ currentStep: 4 }), 'step 4'],
      [stepInfo({ currentStep: 12, isLastStep: true }), 'step 12 (last step)'],
      [stepInfo({ currentStep: 1, isFirstStep: true, isLastStep: true }), 'step 1 (first and last step)'],
      [stepInfo({ isOnReview: true }), 'on the review page'],
    ])('describes %o as "%s"', (reported, expected) => {
      render(<JsonformsReviewNavigation />);

      act(() => {
        wiring.onStepChange?.(reported);
      });

      expect(screen.getByTestId('current-step')).toHaveTextContent(expected);
    });

    it('logs every onStepChange call, newest first, and clears the log on reset', () => {
      render(<JsonformsReviewNavigation />);

      act(() => {
        wiring.onStepChange?.(stepInfo({ isOnTaskList: true }));
      });
      act(() => {
        wiring.onStepChange?.(stepInfo({ isOnReview: true }));
      });

      const rows = screen.getAllByTestId('step-change-log-row');
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveTextContent('0falsefalsetruefalse');
      expect(rows[1]).toHaveTextContent('0falsefalsefalsetrue');

      fireEvent.click(screen.getByTestId('reset-review-navigation'));

      expect(screen.queryAllByTestId('step-change-log-row')).toHaveLength(0);
    });

    it('shows the step outside the form container', () => {
      render(<JsonformsReviewNavigation />);

      const container = screen.getByTestId('review-navigation-form-container');
      expect(container).toContainElement(screen.getByTestId('json-forms'));
      expect(container).not.toContainElement(screen.getByTestId('current-step'));
    });
  });

  describe("the form's own review page", () => {
    beforeEach(() => {
      formUiSchemas.length = 0;
    });

    it('is used by default so the form can reach its review page', () => {
      render(<JsonformsReviewNavigation />);

      expect(formUiSchemas[formUiSchemas.length - 1].options.hideSummary).toBe(false);
    });

    it('can be hidden again, as the CDRT definition does', () => {
      render(<JsonformsReviewNavigation />);

      fireEvent.click(screen.getByTestId('toggle-own-review-page'));

      expect(formUiSchemas[formUiSchemas.length - 1].options.hideSummary).toBe(true);
    });
  });
});
