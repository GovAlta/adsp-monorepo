import { rankWith, RankedTester } from '@jsonforms/core';
import { createSchemaMatchTester } from '../../common/tester';

export const isAddressLookup = createSchemaMatchTester([
  'addressLine2',
  'municipality',
  'addressLine1',
  'subdivisionCode',
  'postalCode',
]);
export const AddressLookUpTester: RankedTester = rankWith(4, isAddressLookup);
