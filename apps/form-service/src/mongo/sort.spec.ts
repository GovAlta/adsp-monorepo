import { InvalidOperationError } from '@core-services/core-common';
import { toSortError, toSortQuery } from './sort';

describe('toSortQuery', () => {
  const fields = { created: 'created', status: 'status', disposition: 'disposition.status' };

  it('can sort by create date descending by default', () => {
    expect(toSortQuery(null, fields, 'data')).toEqual({ created: -1 });
  });

  it('can sort by create date descending for sort without field', () => {
    expect(toSortQuery({ field: '', direction: 'asc' }, fields, 'data')).toEqual({ created: -1 });
  });

  it('can sort ascending on create date', () => {
    expect(toSortQuery({ field: 'created', direction: 'asc' }, fields, 'data')).toEqual({ created: 1 });
  });

  it('can sort descending on create date', () => {
    expect(toSortQuery({ field: 'created', direction: 'desc' }, fields, 'data')).toEqual({ created: -1 });
  });

  it('can sort on a nested mapped field without a tie breaker', () => {
    // A tie breaker makes it a sort on two keys, which needs a composite index; the database does
    // not support those on a nested path.
    expect(toSortQuery({ field: 'disposition', direction: 'asc' }, fields, 'data')).toEqual({
      'disposition.status': 1,
    });
  });

  it('can sort on a top level mapped field with create date tie breaker', () => {
    expect(toSortQuery({ field: 'status', direction: 'asc' }, fields, 'data')).toEqual({
      status: 1,
      created: 1,
    });
  });

  it('can sort on mapped field with tie breaker following the sort direction', () => {
    // Both directions are served by one composite index only if the tie breaker turns with the sort.
    expect(toSortQuery({ field: 'status', direction: 'desc' }, fields, 'data')).toEqual({
      status: -1,
      created: -1,
    });
  });

  it('can sort on data value without a tie breaker', () => {
    // A sort on more than one key needs a composite index, which data value paths cannot have.
    expect(toSortQuery({ field: 'data.firstName', direction: 'desc' }, fields, 'formData')).toEqual({
      'formData.firstName': -1,
    });
  });

  it('can sort on nested data value without a tie breaker', () => {
    expect(toSortQuery({ field: 'data.applicant.lastName', direction: 'asc' }, fields, 'data')).toEqual({
      'data.applicant.lastName': 1,
    });
  });

  it('can throw for field inherited from the object prototype', () => {
    expect(() => toSortQuery({ field: 'constructor', direction: 'asc' }, fields, 'data')).toThrow(
      InvalidOperationError,
    );
  });

  it('can throw for unrecognized field', () => {
    expect(() => toSortQuery({ field: 'updatedBy', direction: 'asc' }, fields, 'data')).toThrow(InvalidOperationError);
  });

  it('can throw for data value path with unsupported characters', () => {
    expect(() => toSortQuery({ field: 'data.$where', direction: 'asc' }, fields, 'data')).toThrow(
      InvalidOperationError,
    );
  });
});

describe('toSortError', () => {
  const sort = { field: 'data.firstName', direction: 'asc' } as const;

  it('can report a sort with no index to serve it as a request error', () => {
    const err = new Error(
      'The order by query does not have a corresponding composite index that it can be served from.',
    );

    const result = toSortError(err, sort);
    expect(result).toBeInstanceOf(InvalidOperationError);
    expect(result.message).toContain('data.firstName');
    // Distinct from the message for a column that is not sortable at all, so the two are told apart.
    expect(result.message).toContain('no index to serve it');
  });

  it('can report an excluded order by path as a request error', () => {
    const err = new Error('The index path corresponding to the specified order-by item is excluded.');

    expect(toSortError(err, sort)).toBeInstanceOf(InvalidOperationError);
  });

  it('can pass through an error that is not about the sort', () => {
    const err = new Error('connection timed out');

    expect(toSortError(err, sort)).toBe(err);
  });

  it('can pass through an error for a request without a sort', () => {
    const err = new Error('The order by query does not have a corresponding composite index.');

    expect(toSortError(err, null)).toBe(err);
  });
});
