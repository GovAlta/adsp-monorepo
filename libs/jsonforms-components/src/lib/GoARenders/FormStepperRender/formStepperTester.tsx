import { rankWith, RankedTester, uiTypeIs } from '@jsonforms/core';

export const categorizationRendererTester: RankedTester = rankWith(6, uiTypeIs('Categorization'));
