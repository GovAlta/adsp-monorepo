import { rankWith, RankedTester } from '@jsonforms/core';
import { createSchemaMatchTester } from '../../common/tester';

export const isFullName = createSchemaMatchTester(['firstName', 'middleName', 'lastName'], true);

export const FullNameTester: RankedTester = rankWith(4, isFullName);
