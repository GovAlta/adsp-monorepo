import { flattenReviewFields, moveItem, reviewFieldLabel, setItemOrder } from './reviewFields';

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

  it('walks objects that have properties but no type', () => {
    const fields = flattenReviewFields({
      properties: {
        city: { type: 'string' },
      },
    });

    expect(fields).toEqual([{ name: 'city', path: 'city', type: 'string' }]);
  });

  it('returns no fields when the root schema is a leaf', () => {
    expect(flattenReviewFields({ type: 'string' })).toEqual([]);
  });

  it('skips null property schemas', () => {
    const fields = flattenReviewFields({
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        ignored: null,
      },
    });

    expect(fields).toEqual([{ name: 'firstName', path: 'firstName', type: 'string' }]);
  });
});

describe('reviewFieldLabel', () => {
  it('includes the name and path', () => {
    expect(reviewFieldLabel({ name: 'First name', path: 'applicant.firstName' })).toBe(
      'First name (applicant.firstName)',
    );
  });
});

describe('setItemOrder', () => {
  const items = ['firstName', 'lastName', 'fileNumber'];

  it('moves an item to a later 1-based position', () => {
    expect(setItemOrder(items, 0, 3)).toEqual(['lastName', 'fileNumber', 'firstName']);
  });

  it('moves an item to an earlier 1-based position', () => {
    expect(setItemOrder(items, 2, 1)).toEqual(['fileNumber', 'firstName', 'lastName']);
  });

  it('clamps an order below 1 to the first position', () => {
    expect(setItemOrder(items, 2, 0)).toEqual(['fileNumber', 'firstName', 'lastName']);
  });

  it('clamps an order above the list length to the last position', () => {
    expect(setItemOrder(items, 0, 99)).toEqual(['lastName', 'fileNumber', 'firstName']);
  });

  it('leaves the list unchanged for a non-numeric order', () => {
    expect(setItemOrder(items, 0, Number.NaN)).toEqual(items);
  });

  it('leaves the list unchanged when the index does not move', () => {
    expect(moveItem(items, 1, 1)).toEqual(items);
  });
});
