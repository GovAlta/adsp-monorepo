import { rankWith, RankedTester } from '@jsonforms/core';
import { createSchemaMatchTester } from '../../common/tester';

export const isContactInformation = createSchemaMatchTester(['email', 'phone', 'preferredContactMethod']);

export const ContactInformationTester: RankedTester = rankWith(4, isContactInformation);
