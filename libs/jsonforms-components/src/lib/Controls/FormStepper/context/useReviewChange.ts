// clean-code-ignore: RULE-19 — covered by ./useReviewChange.spec.tsx, colocated. The rule looks for a
// .test.ts sibling; the hook has to be exercised through a rendered component, so its spec is .tsx.
import { useCallback, useContext } from 'react'; // clean-code-ignore: RULE-19 — see the note at the top of this file.
import { JsonFormsStepperContext } from './StepperContext';
import { useReviewContext } from '../../../Context/ReviewRenderContext';

/**
 * The single way a review summary's Change button reports a click.
 *
 * Two things have to happen and neither is optional. The stepper moves to the page, which is all a
 * host needs when the summary and the form are the same JsonForms instance. The review context is
 * also told, and that is the only signal a host whose summary lives on a *different* page can see —
 * it is what turns into a deep link back into the form.
 *
 * Renderers used to wire these up one at a time, and every renderer except the plain-input one
 * called goToPage alone, so a composite control's Change button was silently inert for a cross-page
 * host. Going through here makes forgetting the second half impossible.
 */
export const useReviewChange = (): ((stepId: number | undefined, scope?: string) => void) => {
  const stepperContext = useContext(JsonFormsStepperContext);
  const reviewContext = useReviewContext();

  return useCallback(
    (stepId: number | undefined, scope?: string) => {
      // Outside a stepper there is no page to move to, but the host may still resolve the field's
      // own page from the scope, so the report below happens either way.
      if (stepId !== undefined) {
        stepperContext?.goToPage(stepId, scope);
      }

      reviewContext?.onChangeDispatch(stepId, scope ?? '');
    },
    [stepperContext, reviewContext],
  );
};
