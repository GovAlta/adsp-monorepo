import { rankWith, RankedTester, schemaTypeIs, and, formatIs } from '@jsonforms/core';

export const FileUploaderTester: RankedTester = rankWith(3, and(schemaTypeIs('string'), formatIs('file-urn')));
