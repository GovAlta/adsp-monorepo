import { rankWith, RankedTester, and, scopeEndsWith } from '@jsonforms/core';

export const FullNameTester: RankedTester = rankWith(5, and(scopeEndsWith('personFullName')));
