import { InvalidOperationError } from '@core-services/core-common';
import { toSortQuery } from './sort';

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

  it('can sort on mapped field with create date tie breaker', () => {
    expect(toSortQuery({ field: 'disposition', direction: 'asc' }, fields, 'data')).toEqual({
      'disposition.status': 1,
      created: -1,
    });
  });

  it('can sort on data value', () => {
    expect(toSortQuery({ field: 'data.firstName', direction: 'desc' }, fields, 'formData')).toEqual({
      'formData.firstName': -1,
      created: -1,
    });
  });

  it('can sort on nested data value', () => {
    expect(toSortQuery({ field: 'data.applicant.lastName', direction: 'asc' }, fields, 'data')).toEqual({
      'data.applicant.lastName': 1,
      created: -1,
    });
  });

  it('can throw for unrecognized field', () => {
    expect(() => toSortQuery({ field: 'updatedBy', direction: 'asc' }, fields, 'data')).toThrow(InvalidOperationError);
  });

  it('can throw for data value path with unsupported characters', () => {
    expect(() => toSortQuery({ field: 'data.$where', direction: 'asc' }, fields, 'data')).toThrow(
      InvalidOperationError,
    );
  });

  it('can throw for empty data value path', () => {
    expect(() => toSortQuery({ field: 'data.', direction: 'asc' }, fields, 'data')).toThrow(InvalidOperationError);
  });
});
