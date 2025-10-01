import { RankedTester, rankWith } from '@jsonforms/core';
import { createSchemaMatchTester } from '../../common/tester';

export const isPhoneNumber = createSchemaMatchTester(['phoneNumber'], false);

export const PhoneNumberTester: RankedTester = rankWith(3, isPhoneNumber);
