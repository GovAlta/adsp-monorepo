import { InvalidOperationError } from '@core-services/core-common';
import { toSortQuery } from './sort';

describe('toSortQuery', () => {
  const fields = { created: 'created', status: 'status', disposition: 'disposition.status' };

  it('can sort by create date descending by default', () => {
    expect(toSortQuery(null, fields)).toEqual({ created: -1 });
  });

  it('can sort by create date descending for sort without field', () => {
    expect(toSortQuery({ field: '', direction: 'asc' }, fields)).toEqual({ created: -1 });
  });

  it('can sort ascending on create date', () => {
    expect(toSortQuery({ field: 'created', direction: 'asc' }, fields)).toEqual({ created: 1 });
  });

  it('can sort descending on create date', () => {
    expect(toSortQuery({ field: 'created', direction: 'desc' }, fields)).toEqual({ created: -1 });
  });

  it('can sort on mapped field with create date tie breaker', () => {
    expect(toSortQuery({ field: 'disposition', direction: 'asc' }, fields)).toEqual({
      'disposition.status': 1,
      created: 1,
    });
  });

  it('can sort on mapped field with tie breaker following the sort direction', () => {
    // Both directions are served by one composite index only if the tie breaker turns with the sort.
    expect(toSortQuery({ field: 'status', direction: 'desc' }, fields)).toEqual({
      status: -1,
      created: -1,
    });
  });

  it('can throw for data value since there is no index to sort it from', () => {
    expect(() => toSortQuery({ field: 'data.firstName', direction: 'desc' }, fields)).toThrow(InvalidOperationError);
  });

  it('can throw for nested data value', () => {
    expect(() => toSortQuery({ field: 'data.applicant.lastName', direction: 'asc' }, fields)).toThrow(
      InvalidOperationError,
    );
  });

  it('can throw for field inherited from the object prototype', () => {
    expect(() => toSortQuery({ field: 'constructor', direction: 'asc' }, fields)).toThrow(
      InvalidOperationError,
    );
  });

  it('can throw for unrecognized field', () => {
    expect(() => toSortQuery({ field: 'updatedBy', direction: 'asc' }, fields)).toThrow(InvalidOperationError);
  });

  it('can throw for data value path with unsupported characters', () => {
    expect(() => toSortQuery({ field: 'data.$where', direction: 'asc' }, fields)).toThrow(InvalidOperationError);
  });
});
