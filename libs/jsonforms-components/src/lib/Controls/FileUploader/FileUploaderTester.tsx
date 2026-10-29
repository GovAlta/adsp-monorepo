import { and, formatIs, rankWith, RankedTester, schemaMatches, schemaTypeIs, or } from '@jsonforms/core';

const isSingleFileUrn = and(schemaTypeIs('string'), formatIs('file-urn'));

const isFileUrnArray = and(
  schemaTypeIs('array'),
  schemaMatches((schema) => {
    if (!schema?.items || Array.isArray(schema.items)) {
      return false;
    }

    return schema.items.type === 'string' && schema.items.format === 'file-urn';
  }),
);

export const FileUploaderTester: RankedTester = rankWith(3, or(isSingleFileUrn, isFileUrnArray));
