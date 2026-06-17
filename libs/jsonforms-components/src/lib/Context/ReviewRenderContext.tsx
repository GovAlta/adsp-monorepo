import { createContext, ReactNode, useCallback, useContext, useMemo, useReducer } from 'react';

export interface ReviewChangeState {
  stepId: number | undefined;
  scope: string;
}

type ReviewChangeAction = { type: 'REVIEW_CHANGE'; payload: ReviewChangeState };

function reviewReducer(_state: ReviewChangeState | null, action: ReviewChangeAction): ReviewChangeState | null {
  if (action.type === 'REVIEW_CHANGE') {
    return action.payload;
  }
  return null;
}

interface ReviewContext {
  isProvided: boolean;
  onChangeDispatch: (stepId: number | undefined, scope: string) => void;
  reviewChange: ReviewChangeState | null;
}

export const ReviewRenderContext = createContext<ReviewContext | undefined>(undefined);

interface ReviewRenderProviderProps {
  children: ReactNode;
  onReviewChange?: (stepId: number | undefined, scope: string) => void;
}

export const ReviewRenderProvider = ({ children, onReviewChange }: ReviewRenderProviderProps): JSX.Element => {
  const [reviewChange, dispatch] = useReducer(reviewReducer, null);

  const onChangeDispatch = useCallback(
    (stepId: number | undefined, scope: string): void => {
      dispatch({ type: 'REVIEW_CHANGE', payload: { stepId, scope } });
      onReviewChange?.(stepId, scope);
    },
    [onReviewChange],
  );

  const context = useMemo(
    () => ({ isProvided: true, onChangeDispatch, reviewChange }),
    [onChangeDispatch, reviewChange],
  );

  return <ReviewRenderContext.Provider value={context}>{children}</ReviewRenderContext.Provider>;
};

export const useReviewContext = (): ReviewContext | undefined => {
  return useContext(ReviewRenderContext);
};
