import { rankWith, RankedTester, uiTypeIs, and, optionIs, categorizationHasCategory } from '@jsonforms/core';

export const CategorizationRendererTester: RankedTester = rankWith(
  2,
  and(uiTypeIs('Categorization'), categorizationHasCategory, optionIs('variant', 'stepper'))
);
