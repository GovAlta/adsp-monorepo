import { rankWith, RankedTester } from '@jsonforms/core';
import { createSchemaMatchTester } from '../../common/tester';

export const isFullNameDoB = createSchemaMatchTester(['firstName', 'middleName', 'lastName', 'dateOfBirth'], true);

export const FullNameDobTester: RankedTester = rankWith(4, isFullNameDoB);
