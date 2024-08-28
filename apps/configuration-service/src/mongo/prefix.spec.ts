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

  it('can handle array', () => {
    const value = {
      $prefixed: [true],
      notPrefixed: false,
    };

    const result = renamePrefixProperties(value, '$', 'META_');
    expect(result).toHaveProperty('META_prefixed');
    expect(result['META_prefixed']).toEqual(expect.arrayContaining([true]));
    expect(result).toHaveProperty('notPrefixed');
    expect(result['notPrefixed']).toBe(false);
  });

  it('can handle array', () => {
    const value = {
      $prefixed: [true],
      notPrefixed: false,
    };

    const result = renamePrefixProperties(value, '$', 'META_');
    expect(result).toHaveProperty('META_prefixed');
    expect(result['META_prefixed']).toEqual(expect.arrayContaining([true]));
    expect(result).toHaveProperty('notPrefixed');
    expect(result['notPrefixed']).toBe(false);
  });

  it('can handle object array', () => {
    const value = {
      $prefixed: [
        {
          $second_level: {
            $third_level: 'test',
          },
        },
      ],
      $prefixed_2: [
        [
          {
            $second_level: {
              $third_level: 'test2',
            },
          },
        ],
      ],
      notPrefixed: false,
    };

    const result = renamePrefixProperties(value, '$', 'META_');
    expect(result['META_prefixed'][0]).toHaveProperty('META_second_level');
    expect(result['META_prefixed'][0]['META_second_level']['META_third_level']).toBe('test');
    expect(result['META_prefixed_2'][0][0]['META_second_level']['META_third_level']).toBe('test2');
    expect(result['notPrefixed']).toBe(false);
    const reversed = renamePrefixProperties(value, 'META_', '$');
    expect(reversed['$prefixed'][0]['$second_level']['$third_level']).toBe('test');
    expect(reversed['$prefixed_2'][0][0]['$second_level']['$third_level']).toBe('test2');
  });
});
