import { rankWith, RankedTester, uiTypeIs, and, optionIs, UISchemaElement, isCategorization } from '@jsonforms/core';

// Ensure that all children (Category) have valid elements or things tend
// to blow up. If not, the the error control will report the problem.
export const categoriesAreValid = (uischema: UISchemaElement): boolean => {
  let isValid = true;
  if ('type' in uischema && uischema.type === 'Categorization' && 'elements' in uischema) {
    (uischema.elements as UISchemaElement[]).forEach((e) => {
      if (e.type !== 'Category' || !('elements' in e)) {
        isValid = false;
      }
    });
  } else {
    return false;
  }
  return isValid;
};

export const CategorizationStepperRendererTester: RankedTester = rankWith(
  2,
  and(
    uiTypeIs('Categorization'),
    categoriesAreValid,
    (uischema) => uischema.options?.variant === 'stepper' || uischema.options?.variant === undefined
  )
);
export const CategorizationPagesRendererTester: RankedTester = rankWith(
  2,
  and(uiTypeIs('Categorization'), categoriesAreValid, (uischema) => uischema.options?.variant === 'pages')
);
