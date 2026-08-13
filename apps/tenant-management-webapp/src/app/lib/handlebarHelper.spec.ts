import { generateMessage } from './handlebarHelper';

describe('generateMessage', () => {
  it('substitutes values into the template', () => {
    expect(generateMessage('Hello {{name}}!', { name: 'Alice' })).toBe('Hello Alice!');
  });

  it('renders nested values', () => {
    expect(generateMessage('{{user.first}} {{user.last}}', { user: { first: 'Ada', last: 'Lovelace' } })).toBe(
      'Ada Lovelace',
    );
  });

  it('leaves unknown placeholders empty', () => {
    expect(generateMessage('Hello {{missing}}!', {})).toBe('Hello !');
  });

  it('returns an empty string when the template is nullish', () => {
    expect(generateMessage(null, { name: 'Alice' })).toBe('');
    expect(generateMessage(undefined, { name: 'Alice' })).toBe('');
  });
});

describe('formatDate helper', () => {
  // 18:30 UTC on 2024-03-15 is 12:30 in Edmonton (MDT, UTC-6).
  const summerInstant = '2024-03-15T18:30:00.000Z';
  // 18:30 UTC on 2024-01-15 is 11:30 in Edmonton (MST, UTC-7).
  const winterInstant = '2024-01-15T18:30:00.000Z';

  it('formats an ISO string in the Edmonton time zone', () => {
    expect(generateMessage('{{formatDate when format="yyyy-MM-dd HH:mm"}}', { when: summerInstant })).toBe(
      '2024-03-15 12:30',
    );
  });

  it('formats a Date in the Edmonton time zone', () => {
    expect(generateMessage('{{formatDate when format="yyyy-MM-dd HH:mm"}}', { when: new Date(summerInstant) })).toBe(
      '2024-03-15 12:30',
    );
  });

  it('applies the daylight saving offset in effect for the date', () => {
    expect(generateMessage('{{formatDate when format="yyyy-MM-dd HH:mm"}}', { when: winterInstant })).toBe(
      '2024-01-15 11:30',
    );
  });

  it('falls back to a default format when none is given', () => {
    const result = generateMessage('{{formatDate when}}', { when: summerInstant });
    expect(result).toContain('2024');
    expect(result).not.toBe(summerInstant);
  });

  it('passes through values that are neither a Date nor a string', () => {
    expect(generateMessage('{{formatDate when}}', { when: 42 })).toBe('42');
  });

  it('does not throw on an unparseable date string', () => {
    expect(() => generateMessage('{{formatDate when format="yyyy-MM-dd"}}', { when: 'not a date' })).not.toThrow();
  });
});
