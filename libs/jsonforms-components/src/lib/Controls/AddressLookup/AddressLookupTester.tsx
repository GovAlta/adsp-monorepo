import { rankWith, RankedTester, isObjectControl } from '@jsonforms/core';

export const AddressLookUpTester: RankedTester = rankWith(3, isObjectControl);
