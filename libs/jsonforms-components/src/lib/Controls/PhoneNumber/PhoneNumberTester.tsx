import { RankedTester, rankWith, and, isControl, schemaTypeIs, formatIs } from '@jsonforms/core';

export const PhoneNumberTester: RankedTester = rankWith(4, and(isControl, schemaTypeIs('string'), formatIs('phone')));
