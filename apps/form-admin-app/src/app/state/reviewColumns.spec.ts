import { flattenReviewFields, resolveReviewColumns } from './reviewColumns';

const applicantSchema = {
  type: 'object',
  properties: {
    applicant: {
      type: 'object',
      properties: {
        firstName: { type: 'string', title: 'First name' },
        lastName: { type: 'string', title: 'Last name' },
      },
    },
    fileNumber: { type: 'number' },
    statusNote: { type: 'string', title: 'Status note' },
  },
};

describe('flattenReviewFields', () => {
  it('returns an empty list for missing or non-object schema', () => {
    expect(flattenReviewFields(undefined)).toEqual([]);
    expect(flattenReviewFields(null)).toEqual([]);
    expect(flattenReviewFields('string')).toEqual([]);
  });

  it('flattens nested object properties to leaf paths', () => {
    const fields = flattenReviewFields({
      type: 'object',
      properties: {
        applicant: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
        fileNumber: { type: 'number' },
      },
    });

    expect(fields).toEqual([
      { name: 'firstName', path: 'applicant.firstName', type: 'string' },
      { name: 'lastName', path: 'applicant.lastName', type: 'string' },
      { name: 'fileNumber', path: 'fileNumber', type: 'number' },
    ]);
  });

  it('uses schema title when present', () => {
    const fields = flattenReviewFields({
      type: 'object',
      properties: {
        firstName: { type: 'string', title: 'First name' },
      },
    });

    expect(fields).toEqual([{ name: 'First name', path: 'firstName', type: 'string' }]);
  });

  it('treats arrays as leaves', () => {
    const fields = flattenReviewFields({
      type: 'object',
      properties: {
        dependents: { type: 'array', items: { type: 'string' } },
      },
    });

    expect(fields).toEqual([{ name: 'dependents', path: 'dependents', type: 'array' }]);
  });
});

describe('resolveReviewColumns', () => {
  it('returns no columns when review configuration is missing', () => {
    expect(resolveReviewColumns(applicantSchema)).toEqual([]);
  });

  it('returns no columns when review configuration has no columns', () => {
    expect(resolveReviewColumns(applicantSchema, { columns: [] })).toEqual([]);
  });

  it('returns configured columns in the specified order', () => {
    const columns = resolveReviewColumns(applicantSchema, {
      columns: [{ path: 'fileNumber' }, { path: 'applicant.firstName' }],
    });

    expect(columns.map((column) => column.path)).toEqual(['fileNumber', 'applicant.firstName']);
  });

  it('uses the schema title for a configured column header', () => {
    const columns = resolveReviewColumns(applicantSchema, {
      columns: [{ path: 'applicant.firstName' }],
    });

    expect(columns[0]).toEqual({ name: 'First name', path: 'applicant.firstName', type: 'string' });
  });

  it('does not add schema fields that are not in the review configuration', () => {
    const columns = resolveReviewColumns(applicantSchema, {
      columns: [{ path: 'fileNumber' }],
    });

    expect(columns.map((column) => column.path)).toEqual(['fileNumber']);
  });

  it('keeps a configured path that is no longer in the schema', () => {
    const columns = resolveReviewColumns(applicantSchema, {
      columns: [{ path: 'applicant.removedField' }],
    });

    expect(columns).toEqual([{ name: 'removedField', path: 'applicant.removedField' }]);
  });
});
