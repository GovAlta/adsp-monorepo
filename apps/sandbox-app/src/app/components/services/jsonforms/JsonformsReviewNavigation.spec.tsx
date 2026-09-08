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
} = {};

jest.mock('@abgov/jsonforms-components', () => ({
  ContextProviderFactory:
    () =>
    ({
      children,
      navigationTarget,
      onNavigationChange,
    }: {
      children: React.ReactNode;
      navigationTarget?: { pageId?: string; scope?: string };
      onNavigationChange?: (outcome: { status: string; pageId: string }) => void;
    }) => {
      // The page renders two of these; only the one wrapping the form carries the navigation wiring.
      if (onNavigationChange) {
        wiring.navigationTarget = navigationTarget;
        wiring.onNavigationChange = onNavigationChange;
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

jest.mock('@jsonforms/react', () => ({
  JsonForms: () => <div data-testid="json-forms" />,
}));

jest.mock('../../styled-components', () => ({
  ServiceContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@abgov/react-components', () => ({
  GoabContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabText: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  GoabCallout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
  });

  it('lists every page the definition lets a host address', () => {
    render(<JsonformsReviewNavigation />);

    expect(screen.getByTestId('navigation-target-page-1')).toHaveTextContent('What is your dispute about?');
    expect(screen.getByTestId('navigation-target-page-13')).toHaveTextContent('Add optional supporting documents');
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
});
