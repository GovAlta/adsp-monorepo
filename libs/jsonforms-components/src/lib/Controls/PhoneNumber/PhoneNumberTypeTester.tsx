import { rankWith } from '@jsonforms/core';
import { createSchemaMatchTester } from '../../common/tester';

export const isPhoneNumberWithType = createSchemaMatchTester(['number', 'type'], true);
export const PhoneNumberWithTypeTester = rankWith(4, isPhoneNumberWithType);
