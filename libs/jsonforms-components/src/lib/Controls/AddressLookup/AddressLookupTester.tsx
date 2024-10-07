import { rankWith, RankedTester, and, scopeEndsWith } from '@jsonforms/core';

export const AddressLookUpTester: RankedTester = rankWith(3, and(scopeEndsWith('mailingAddress')));
