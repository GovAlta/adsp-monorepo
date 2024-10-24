import { rankWith, RankedTester, and, scopeEndsWith } from '@jsonforms/core';

export const FullNameDobTester: RankedTester = rankWith(4, and(scopeEndsWith('dateOfBirth')));
