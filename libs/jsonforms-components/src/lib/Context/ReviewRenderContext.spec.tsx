import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ReviewRenderProvider,
  useReviewContext,
  REVIEW_CHANGE_ACTION,
  ReviewChangeState,
} from './ReviewRenderContext';

function Consumer({ onContext }: { onContext: (ctx: ReturnType<typeof useReviewContext>) => void }): JSX.Element {
  const ctx = useReviewContext();
  onContext(ctx);
  return <button data-testid="trigger" onClick={() => ctx?.onChangeDispatch(1, '#/properties/firstName')} />;
}

describe('ReviewRenderProvider', () => {
  it('provides isProvided=true to consumers', () => {
    let captured: ReturnType<typeof useReviewContext>;
    render(
      <ReviewRenderProvider>
        <Consumer onContext={(ctx) => (captured = ctx)} />
      </ReviewRenderProvider>,
    );
    expect(captured!.isProvided).toBe(true);
  });

  it('reviewChange is null before any dispatch', () => {
    let captured: ReturnType<typeof useReviewContext>;
    render(
      <ReviewRenderProvider>
        <Consumer onContext={(ctx) => (captured = ctx)} />
      </ReviewRenderProvider>,
    );
    expect(captured!.reviewChange).toBeNull();
  });

  it('updates reviewChange state after onChangeDispatch', () => {
    let captured: ReturnType<typeof useReviewContext>;
    const { getByTestId } = render(
      <ReviewRenderProvider>
        <Consumer onContext={(ctx) => (captured = ctx)} />
      </ReviewRenderProvider>,
    );

    act(() => {
      getByTestId('trigger').click();
    });

    expect(captured!.reviewChange).toEqual<ReviewChangeState>({ stepId: 1, scope: '#/properties/firstName' });
  });

  it('calls onReviewChange prop with stepId and scope', () => {
    const onReviewChange = jest.fn();
    const { getByTestId } = render(
      <ReviewRenderProvider onReviewChange={onReviewChange}>
        <Consumer onContext={() => {}} />
      </ReviewRenderProvider>,
    );

    act(() => {
      getByTestId('trigger').click();
    });

    expect(onReviewChange).toHaveBeenCalledWith(1, '#/properties/firstName');
  });

  it('does not throw when onReviewChange prop is not provided', () => {
    const { getByTestId } = render(
      <ReviewRenderProvider>
        <Consumer onContext={() => {}} />
      </ReviewRenderProvider>,
    );

    expect(() => act(() => getByTestId('trigger').click())).not.toThrow();
  });
});

describe('useReviewContext', () => {
  it('returns undefined when used outside ReviewRenderProvider', () => {
    let captured: ReturnType<typeof useReviewContext>;
    render(<Consumer onContext={(ctx) => (captured = ctx)} />);
    expect(captured!).toBeUndefined();
  });
});

describe('REVIEW_CHANGE_ACTION', () => {
  it('has the correct namespaced value', () => {
    expect(REVIEW_CHANGE_ACTION).toBe('jsonforms/review/change');
  });
});
