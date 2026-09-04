// A named format: the display mask, the validation pattern, the error shown when invalid,
// and the characters this format allows to be typed (beyond the base control keys).
export interface MaskPattern {
  mask: string;
  pattern: RegExp;
  error: string;
  allowedKeys?: RegExp;
}

// Default formats keyed by type; the mask can be overridden per field via UI schema options.
export const DEFAULT_PATTERNS: Record<string, MaskPattern> = {
  phone: {
    mask: '(###) ###-####',
    pattern: /^\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/,
    error: 'Must be a valid 10-digit phone number in format (000) 000-0000',
    allowedKeys: /[0-9]/,
  },
  sin: {
    mask: '### ### ###',
    pattern: /^\d{3} \d{3} \d{3}$/,
    error: 'Must be three groups of three digits.',
    allowedKeys: /[0-9]/,
  },
  postalCode: {
    mask: '### ###',
    pattern: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    error: 'Must be in A0A 0A0 capital letters and numbers format',
    allowedKeys: /[A-Za-z0-9]/,
  },
  driverId: {
    // Alberta driver's licence: six digits, a dash, then three digits.
    mask: '######-###',
    pattern: /^\d{6}-\d{3}$/,
    error: "Must be a valid driver's licence number in format 000000-000",
    allowedKeys: /[0-9]/,
  },
};

// Mask placeholder characters; each consumes one input character. Any other mask character is treated as a literal.
export const MASK_PLACEHOLDERS = new Set(['#', '*', '_']);
const isPlaceholder = (char: string): boolean => MASK_PLACEHOLDERS.has(char);

// Navigation/editing keys that keystroke filtering must always let through.
export const MASK_CONTROL_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Enter',
  'Escape',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

// A single-character key should be blocked when the format restricts input and the key isn't allowed.
export const shouldBlockKey = (key: string, allowedKeys?: RegExp): boolean =>
  !!allowedKeys && key.length === 1 && !MASK_CONTROL_KEYS.has(key) && !allowedKeys.test(key);

// Removes characters the format doesn't allow (e.g. letters from a digit-only field), for paste/programmatic input.
export const filterAllowedKeys = (value: string, allowedKeys?: RegExp): string =>
  allowedKeys ? [...(value ?? '')].filter((char) => allowedKeys.test(char)).join('') : (value ?? '');

// A mask slot holds one content character (letter or digit); everything else in the value is a separator.
const NON_CONTENT = /[^a-zA-Z0-9]/g;
const IS_CONTENT = /[a-zA-Z0-9]/;

// Number of fill slots in a mask (its placeholder characters).
export const maskDigitCount = (mask: string): number => [...mask].filter(isPlaceholder).length;

// Formats a value into a placeholder mask (e.g. '(###) ###-####'), filling only the content entered so far.
// Placeholder characters consume one content character each; every other mask character is a literal.
export const formatWithPattern = (value: string, mask: string): string => {
  const maxContent = maskDigitCount(mask);
  const content = (value ?? '').replace(NON_CONTENT, '').slice(0, maxContent);

  let index = 0;
  let formatted = '';
  for (const maskChar of mask) {
    if (index >= content.length) {
      break;
    }
    formatted += isPlaceholder(maskChar) ? content[index++] : maskChar;
  }
  return formatted;
};

// Fills the mask with the value's content, leaving the placeholder character for positions not yet entered.
export const toMaskTemplate = (value: string, mask: string): string => {
  const maxContent = maskDigitCount(mask);
  const content = (value ?? '').replace(NON_CONTENT, '').slice(0, maxContent);

  let index = 0;
  let display = '';
  for (const maskChar of mask) {
    display += isPlaceholder(maskChar) ? (index < content.length ? content[index++] : maskChar) : maskChar;
  }
  return display;
};

// Caret position just after the Nth content character within a rendered mask, so in-place edits keep the cursor in place.
export const caretAfterDigits = (display: string, digitCount: number): number => {
  if (digitCount <= 0) {
    return 0;
  }
  let seen = 0;
  for (let i = 0; i < display.length; i++) {
    if (IS_CONTENT.test(display[i])) {
      seen += 1;
      if (seen === digitCount) {
        return i + 1;
      }
    }
  }
  return display.length;
};

export interface MaskEdit {
  display: string; // in-place template with placeholder characters for unfilled slots
  stored: string; // clean formatted value without trailing template characters
  caret: number; // caret position to restore within the display
}

// Computes an in-place masked edit from the raw input and caret index: what to show, what to store, where to put the caret.
export const computeMaskEdit = (rawValue: string, caretIndex: number, mask: string): MaskEdit => {
  const digitsBeforeCaret = rawValue.slice(0, caretIndex).replace(NON_CONTENT, '').length;
  const display = toMaskTemplate(rawValue, mask);
  const stored = formatWithPattern(rawValue, mask);
  const caret = caretAfterDigits(display, Math.min(digitsBeforeCaret, maskDigitCount(mask)));
  return { display, stored, caret };
};

// True once the value has as many content characters as the mask has fill slots.
export const isMaskFilled = (value: string, mask: string): boolean =>
  value.replace(NON_CONTENT, '').length >= maskDigitCount(mask);

// A human placeholder for a mask, e.g. '(###) ###-####' -> '(000) 000-0000'.
export const maskPlaceholder = (mask: string): string =>
  [...mask].map((char) => (isPlaceholder(char) ? '0' : char)).join('');

type MaskInputTarget = (HTMLInputElement & { setSelectionRange?: (start: number, end: number) => void }) | undefined;

// Extracts the underlying input element from a GoA change/keypress detail, if available.
export const getMaskInputTarget = (detail: { event?: Event }): MaskInputTarget =>
  (detail.event?.target as MaskInputTarget) ?? undefined;

// Applies an in-place edit to the DOM: forces the (fixed-length) value and restores the caret after React commits.
export const applyInPlaceEdit = (target: MaskInputTarget, edit: MaskEdit): void => {
  if (!target) {
    return;
  }
  target.value = edit.display;
  if (target.setSelectionRange) {
    requestAnimationFrame(() => target.setSelectionRange?.(edit.caret, edit.caret));
  }
};

/**
 * Applies a mask template to a value, e.g. mask "(###) ###-####" turns "7801234567" into "(780) 123-4567".
 * '#' consumes one content character from the input; every other character is a literal inserted into the output.
 * The mask's literal characters are stripped from the input first so an already formatted value re-formats cleanly.
 * Returns the original value unchanged when the mask is empty or no content characters remain.
 * @param value - The raw input value
 * @param mask - The mask template string
 * @returns The masked value
 */
export const applyFormatPattern = (value: string, mask: string | undefined): string => {
  if (!mask || !value) {
    return value;
  }

  const literals = new Set(mask.split('').filter((char) => !isPlaceholder(char)));
  const content = value.split('').filter((char) => !literals.has(char));

  if (content.length === 0) {
    return value;
  }

  let contentIndex = 0;
  let result = '';
  for (const maskChar of mask) {
    if (contentIndex >= content.length) {
      break;
    }
    if (isPlaceholder(maskChar)) {
      result += content[contentIndex];
      contentIndex += 1;
    } else {
      result += maskChar;
    }
  }

  // Append any remaining content characters that did not fit the mask.
  if (contentIndex < content.length) {
    result += content.slice(contentIndex).join('');
  }

  return result;
};
