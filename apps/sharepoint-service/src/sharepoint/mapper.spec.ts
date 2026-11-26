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

  it.each([
    ['a Hyperlink column', { columnType: 'hyperlink' as const }],
    ['an older mapping that writes Hyperlink values', { linkFormat: 'hyperlink' as const }],
  ])('clears %s with null for an empty value, since SharePoint rejects text there', (_case, mapping) => {
    expect(mapFields([{ source: 'proof', target: 'Proof', ...mapping }], { proof: '' }, null)).toEqual({ Proof: null });
  });

  it('keeps an empty value for a text column, even one whose file links are written as Hyperlink values', () => {
    expect(
      mapFields([{ source: 'note', target: 'Note', columnType: 'text', linkFormat: 'hyperlink' }], { note: '' }, null),
    ).toEqual({ Note: '' });
  });

  it('writes a link value to a Hyperlink column', () => {
    const link = { Url: 'https://example.com/proof.pdf', Description: 'proof.pdf' };
    expect(mapFields([{ source: 'proof', target: 'Proof', columnType: 'hyperlink' }], { proof: link }, null)).toEqual({
      Proof: link,
    });
  });

  it('does not let a mapping overwrite the key column', () => {
    const fields = mapFields([{ source: 'other', target: ITEM_KEY_COLUMN }], { other: 'spoofed' }, 'real-key');
    expect(fields[ITEM_KEY_COLUMN]).toBe('real-key');
  });

  it('leaves the key column out when there is no key', () => {
    expect(mapFields([{ source: 'amount', target: 'Amount' }], { amount: 1 }, null)).toEqual({ Amount: 1 });
  });

  it('maps values inside arrays', () => {
    const fields = mapFields(
      [{ source: 'dependents[1].name', target: 'SecondDependent' }],
      { dependents: [{ name: 'Bo' }, { name: 'Cy' }] },
      null,
    );
    expect(fields).toEqual({ SecondDependent: 'Cy' });
  });

  it('marks a multi-select answer as a collection so it fills a Choice (multiple) column', () => {
    const fields = mapFields(
      [{ source: 'contactMethods', target: 'ContactMethods' }],
      {
        contactMethods: ['Email', 'Phone'],
      },
      null,
    );
    expect(fields).toEqual({
      'ContactMethods@odata.type': 'Collection(Edm.String)',
      ContactMethods: ['Email', 'Phone'],
    });
  });

  it('sends numbers in a multi-select answer as text', () => {
    expect(mapFields([{ source: 'years', target: 'Years' }], { years: [2025, 2026] }, null).Years).toEqual([
      '2025',
      '2026',
    ]);
  });

  it('sends an empty multi-select answer so a re-push clears the column', () => {
    expect(mapFields([{ source: 'contactMethods', target: 'ContactMethods' }], { contactMethods: [] }, null)).toEqual({
      'ContactMethods@odata.type': 'Collection(Edm.String)',
      ContactMethods: [],
    });
  });

  it('does not mark a single value or an array of objects as a collection', () => {
    const fields = mapFields(
      [
        { source: 'name', target: 'Name' },
        { source: 'dependents', target: 'Dependents' },
      ],
      { name: 'Ada', dependents: [{ name: 'Bo' }] },
      null,
    );
    expect(fields).toEqual({ Name: 'Ada', Dependents: [{ name: 'Bo' }] });
  });

  it('does not let a multi-select mapping change the key column', () => {
    const fields = mapFields([{ source: 'tags', target: ITEM_KEY_COLUMN }], { tags: ['a'] }, 'real-key');
    expect(fields).toEqual({ [ITEM_KEY_COLUMN]: 'real-key' });
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

  it('reads a key field inside an array', () => {
    expect(itemKeyFor(['applications[0].number'], { applications: [{ number: 'A-12' }] })).toBe('A-12');
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
