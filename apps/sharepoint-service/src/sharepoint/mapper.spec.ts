import { InvalidOperationError } from '@core-services/core-common';
import { ITEM_KEY_COLUMN, itemKeyFor, mapFields, RowIdentityMissingError } from './mapper';

describe('mapFields', () => {
  it('maps dot-path sources to target columns and adds the key column', () => {
    const fields = mapFields(
      [
        { source: 'applicant.name.first', target: 'FirstName' },
        { source: 'amount', target: 'Amount' },
      ],
      { applicant: { name: { first: 'Ada' } }, amount: 12 },
      'submission-1',
    );
    expect(fields).toEqual({ FirstName: 'Ada', Amount: 12, [ITEM_KEY_COLUMN]: 'submission-1' });
  });

  it('skips sources that are missing from the data', () => {
    const fields = mapFields([{ source: 'applicant.phone', target: 'Phone' }], { applicant: {} }, 'k');
    expect(fields).toEqual({ [ITEM_KEY_COLUMN]: 'k' });
  });

  it('keeps null values so a re-push can clear a column', () => {
    expect(mapFields([{ source: 'note', target: 'Note' }], { note: null }, 'k')).toEqual({
      Note: null,
      [ITEM_KEY_COLUMN]: 'k',
    });
  });

  it('does not let a mapping overwrite the key column', () => {
    const fields = mapFields([{ source: 'other', target: ITEM_KEY_COLUMN }], { other: 'spoofed' }, 'real-key');
    expect(fields[ITEM_KEY_COLUMN]).toBe('real-key');
  });

  it('leaves the key column out when there is no key', () => {
    expect(mapFields([{ source: 'amount', target: 'Amount' }], { amount: 1 }, null)).toEqual({ Amount: 1 });
  });
});

describe('itemKeyFor', () => {
  it('returns null when no idempotency fields are configured', () => {
    expect(itemKeyFor(undefined, { a: 1 })).toBeNull();
    expect(itemKeyFor([], { a: 1 })).toBeNull();
  });

  it('builds the key from the configured field values in order', () => {
    expect(itemKeyFor(['application.number'], { application: { number: 'A-12' } })).toBe('A-12');
    expect(itemKeyFor(['program', 'year'], { program: 'grants', year: 2026 })).toBe('grants|2026');
  });

  it('reads the Form Service key from _adsp', () => {
    expect(itemKeyFor(['_adsp.key'], { amount: 1, _adsp: { key: 'submission-1', formId: 'form-1' } })).toBe(
      'submission-1',
    );
  });

  it('rejects data missing a configured field', () => {
    expect(() => itemKeyFor(['application.number'], { application: {} })).toThrow(RowIdentityMissingError);
    expect(() => itemKeyFor(['application.number'], { application: {} })).toThrow(InvalidOperationError);
    expect(() => itemKeyFor(['id'], { id: null })).toThrow(InvalidOperationError);
  });

  it('rejects a field whose value is an object', () => {
    expect(() => itemKeyFor(['applicant'], { applicant: { name: 'Ada' } })).toThrow(InvalidOperationError);
  });
});
