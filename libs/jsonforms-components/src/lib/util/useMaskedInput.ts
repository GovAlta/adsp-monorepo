import { useEffect, useState } from 'react';
import {
  applyInPlaceEdit,
  computeMaskEdit,
  filterAllowedKeys,
  formatWithPattern,
  getMaskInputTarget,
  isMaskFilled,
  overflowMaskEdit,
  shouldBlockKey,
  toMaskTemplate,
} from './patternForm';

interface MaskChangeDetail {
  value: string;
  event?: Event;
}

interface MaskKeyPressDetail {
  key: string;
  event?: Event;
}

interface UseMaskedInputOptions {
  mask: string;
  // When true the field shows the fill-in template and edits keep the caret in place.
  inPlace: boolean;
  data: unknown;
  allowedKeys?: RegExp;
  // Receives the clean formatted value whenever it changes.
  onCommit: (stored: string) => void;
}

interface UseMaskedInputResult {
  value: string;
  handleChange: (detail: MaskChangeDetail) => void;
  handleKeyPress: (detail: MaskKeyPressDetail) => void;
}

// Encapsulates masked-input state for a GoA input: display value, mount reflection, and change/keypress handling.
const resetMaskedValue = (detail: MaskChangeDetail, nextValue: string) => {
  const target = getMaskInputTarget(detail);
  if (target) {
    target.value = nextValue;
  }
};

export const useMaskedInput = ({
  mask,
  inPlace,
  data,
  allowedKeys,
  onCommit,
}: UseMaskedInputOptions): UseMaskedInputResult => {
  const format = (value: string): string => (inPlace ? toMaskTemplate(value, mask) : formatWithPattern(value, mask));

  const initialDisplay = format(typeof data === 'string' ? data : '');
  // In-place mounts empty then sets the template so the web component reflects it (a value change forces the paint).
  const [value, setValue] = useState<string>(inPlace ? '' : initialDisplay);

  useEffect(() => {
    if (inPlace) {
      setValue(initialDisplay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (detail: MaskChangeDetail) => {
    const rawValue = detail.value;
    const cleaned = allowedKeys ? filterAllowedKeys(rawValue, allowedKeys) : rawValue;

    if (!inPlace) {
      const stored = cleaned === '' ? '' : formatWithPattern(cleaned, mask);
      if (allowedKeys && cleaned !== rawValue) {
        resetMaskedValue(detail, stored);
      }
      setValue(stored);
      onCommit(stored);
      return;
    }

    const target = getMaskInputTarget(detail);
    const caretIndex = target?.selectionStart ?? cleaned.length;
    const overflow = overflowMaskEdit(value, cleaned, caretIndex, mask);
    if (overflow) {
      applyInPlaceEdit(target, overflow);
      return;
    }

    const edit = computeMaskEdit(cleaned, caretIndex, mask);

    applyInPlaceEdit(target, edit);
    setValue(edit.display);
    onCommit(edit.stored);
  };

  // In-place has no maxLength (the template is already full length) and GoA keyPress is keyup, so restore on overflow.
  const handleKeyPress = (detail: MaskKeyPressDetail) => {
    const blockDisallowed = shouldBlockKey(detail.key, allowedKeys);
    const blockOverflow = inPlace && /^[A-Za-z0-9]$/.test(detail.key) && isMaskFilled(value, mask);
    if (!blockDisallowed && !blockOverflow) {
      return;
    }

    detail.event?.preventDefault();
    if (!blockOverflow) {
      return;
    }

    const target = getMaskInputTarget(detail);
    const rawValue = target?.value ?? value;
    const overflow = overflowMaskEdit(value, rawValue, target?.selectionStart ?? value.length, mask);
    if (overflow) {
      applyInPlaceEdit(target, overflow);
    }
  };

  return { value, handleChange, handleKeyPress };
};
