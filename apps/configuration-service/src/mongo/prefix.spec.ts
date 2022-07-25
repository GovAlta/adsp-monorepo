import { renamePrefixProperties } from './prefix';

describe('renamePrefixProperties', () => {
  it('can rename prefix property', () => {
    const value = {
      $prefixed: true,
      notPrefixed: false,
    };

    const result = renamePrefixProperties(value, '$', 'META_');
    expect(result).toHaveProperty('META_prefixed');
    expect(result['META_prefixed']).toBe(true);
    expect(result).toHaveProperty('notPrefixed');
    expect(result['notPrefixed']).toBe(false);
  });

  it('can recurse', () => {
    const value = {
      nested: {
        $prefixed: true,
        notPrefixed: false,
      },
      $prefixed: true,
    };

    const result = renamePrefixProperties(value, '$', 'META_');
    expect(result).toHaveProperty('META_prefixed');
    expect(result['META_prefixed']).toBe(true);
    expect(result).toHaveProperty('nested.META_prefixed');
    expect(result['nested']['META_prefixed']).toBe(true);
  });
});
