import {
  DEFAULT_PATTERNS,
  MASK_CONTROL_KEYS,
  MASK_PLACEHOLDERS,
  applyFormatPattern,
  applyInPlaceEdit,
  caretAfterDigits,
  computeMaskEdit,
  filterAllowedKeys,
  formatWithPattern,
  getMaskInputTarget,
  isMaskFilled,
  maskDigitCount,
  maskPlaceholder,
  shouldBlockKey,
  toMaskTemplate,
} from './patternForm';

describe('DEFAULT_PATTERNS', () => {
  it('accepts a formatted phone number', () => {
    expect(DEFAULT_PATTERNS.phone.pattern.test('(403) 555-1212')).toBe(true);
  });

  it('rejects an incomplete phone number', () => {
    expect(DEFAULT_PATTERNS.phone.pattern.test('403555')).toBe(false);
  });

  it('accepts a spaced SIN', () => {
    expect(DEFAULT_PATTERNS.sin.pattern.test('123 456 789')).toBe(true);
  });

  it('rejects a SIN without spaces', () => {
    expect(DEFAULT_PATTERNS.sin.pattern.test('123456789')).toBe(false);
  });

  it('accepts a Canadian postal code', () => {
    expect(DEFAULT_PATTERNS.postalCode.pattern.test('T2P 1A1')).toBe(true);
  });

  it('rejects a postal code without a space', () => {
    expect(DEFAULT_PATTERNS.postalCode.pattern.test('T2P1A1')).toBe(false);
  });

  it('accepts an Alberta driver licence number', () => {
    expect(DEFAULT_PATTERNS.driverId.pattern.test('123456-789')).toBe(true);
  });

  it('rejects a driver licence number without a dash', () => {
    expect(DEFAULT_PATTERNS.driverId.pattern.test('123456789')).toBe(false);
  });

  it('accepts a formatted motor vehicle ID', () => {
    expect(DEFAULT_PATTERNS.mvid.pattern.test('1234-56789')).toBe(true);
  });

  it('rejects a motor vehicle ID without a dash', () => {
    expect(DEFAULT_PATTERNS.mvid.pattern.test('123456789')).toBe(false);
  });
});

describe('shouldBlockKey', () => {
  it('blocks a letter when only digits are allowed', () => {
    expect(shouldBlockKey('a', /[0-9]/)).toBe(true);
  });

  it('allows a digit when digits are allowed', () => {
    expect(shouldBlockKey('5', /[0-9]/)).toBe(false);
  });

  it('allows Backspace even when input is restricted', () => {
    expect(shouldBlockKey('Backspace', /[0-9]/)).toBe(false);
  });

  it('does not block keys when no restriction is set', () => {
    expect(shouldBlockKey('a', undefined)).toBe(false);
  });
});

describe('filterAllowedKeys', () => {
  it('strips letters from a digit-only format', () => {
    expect(filterAllowedKeys('12a3b', /[0-9]/)).toBe('123');
  });

  it('returns the original value when no restriction is set', () => {
    expect(filterAllowedKeys('12a3b', undefined)).toBe('12a3b');
  });

  it('treats a missing value as empty', () => {
    expect(filterAllowedKeys(undefined as unknown as string, /[0-9]/)).toBe('');
  });
});

describe('maskDigitCount', () => {
  it('counts placeholder characters in a phone mask', () => {
    expect(maskDigitCount(DEFAULT_PATTERNS.phone.mask)).toBe(10);
  });

  it('counts placeholder characters in a driver licence mask', () => {
    expect(maskDigitCount(DEFAULT_PATTERNS.driverId.mask)).toBe(9);
  });
});

describe('formatWithPattern', () => {
  it('formats a phone number as digits are entered', () => {
    expect(formatWithPattern('4035551212', DEFAULT_PATTERNS.phone.mask)).toBe('(403) 555-1212');
  });

  it('stops at the last entered content character', () => {
    expect(formatWithPattern('40355', DEFAULT_PATTERNS.phone.mask)).toBe('(403) 55');
  });

  it('formats a driver licence number', () => {
    expect(formatWithPattern('123456789', DEFAULT_PATTERNS.driverId.mask)).toBe('123456-789');
  });

  it('formats a motor vehicle ID', () => {
    expect(formatWithPattern('123456789', DEFAULT_PATTERNS.mvid.mask)).toBe('1234-56789');
  });

  it('formats a postal code', () => {
    expect(formatWithPattern('T2P1A1', DEFAULT_PATTERNS.postalCode.mask)).toBe('T2P 1A1');
  });

  it('treats a missing value as empty', () => {
    expect(formatWithPattern(undefined as unknown as string, DEFAULT_PATTERNS.phone.mask)).toBe('');
  });
});

describe('toMaskTemplate', () => {
  it('fills entered digits and leaves remaining placeholders', () => {
    expect(toMaskTemplate('40355', DEFAULT_PATTERNS.phone.mask)).toBe('(403) 55#-####');
  });

  it('returns the full template when the value is empty', () => {
    expect(toMaskTemplate('', DEFAULT_PATTERNS.driverId.mask)).toBe('######-###');
  });
});

describe('caretAfterDigits', () => {
  it('returns 0 when no content has been entered', () => {
    expect(caretAfterDigits('(###) ###-####', 0)).toBe(0);
  });

  it('places the caret after the requested content character', () => {
    expect(caretAfterDigits('(403) 55#-####', 5)).toBe(8);
  });

  it('returns the end of the display when more digits are requested than exist', () => {
    expect(caretAfterDigits('(403)', 10)).toBe(5);
  });
});

describe('computeMaskEdit', () => {
  it('builds the in-place display, stored value, and caret for a partial phone number', () => {
    const edit = computeMaskEdit('40355', 5, DEFAULT_PATTERNS.phone.mask);

    expect(edit).toEqual({
      display: '(403) 55#-####',
      stored: '(403) 55',
      caret: 8,
    });
  });
});

describe('isMaskFilled', () => {
  it('is false until every placeholder is filled', () => {
    expect(isMaskFilled('(403) 555-121', DEFAULT_PATTERNS.phone.mask)).toBe(false);
  });

  it('is true once every placeholder is filled', () => {
    expect(isMaskFilled('(403) 555-1212', DEFAULT_PATTERNS.phone.mask)).toBe(true);
  });
});

describe('maskPlaceholder', () => {
  it('replaces placeholders with zeros for a phone mask', () => {
    expect(maskPlaceholder(DEFAULT_PATTERNS.phone.mask)).toBe('(000) 000-0000');
  });
});

describe('getMaskInputTarget', () => {
  it('returns the event target when present', () => {
    const target = document.createElement('input');
    const detail = { event: { target } as unknown as Event };

    expect(getMaskInputTarget(detail)).toBe(target);
  });

  it('returns undefined when the event has no target', () => {
    expect(getMaskInputTarget({})).toBeUndefined();
  });
});

describe('applyInPlaceEdit', () => {
  it('does nothing when the target is missing', () => {
    expect(() =>
      applyInPlaceEdit(undefined, { display: '(403) 555-1212', stored: '(403) 555-1212', caret: 14 }),
    ).not.toThrow();
  });

  it('writes the display value and restores the caret', () => {
    const target = document.createElement('input');
    const setSelectionRange = jest.fn();
    target.setSelectionRange = setSelectionRange;
    const animationFrame = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    applyInPlaceEdit(target, { display: '(403) 55#-####', stored: '(403) 55', caret: 8 });

    expect(target.value).toBe('(403) 55#-####');
    expect(setSelectionRange).toHaveBeenCalledWith(8, 8);

    animationFrame.mockRestore();
  });
});

describe('applyFormatPattern', () => {
  it('formats leftover content that does not fit the mask', () => {
    expect(applyFormatPattern('12345678901234', DEFAULT_PATTERNS.driverId.mask)).toBe('123456-78901234');
  });
});

describe('mask constants', () => {
  it('treats hash, star, and underscore as placeholders', () => {
    expect(MASK_PLACEHOLDERS.has('#')).toBe(true);
    expect(MASK_PLACEHOLDERS.has('*')).toBe(true);
    expect(MASK_PLACEHOLDERS.has('_')).toBe(true);
  });

  it('includes Backspace as a control key', () => {
    expect(MASK_CONTROL_KEYS.has('Backspace')).toBe(true);
  });
});
