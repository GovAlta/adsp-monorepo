import { useEffect, useState } from 'react';
import {
  applyInPlaceEdit,
  computeMaskEdit,
  formatWithPattern,
  getMaskInputTarget,
  isMaskFilled,
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
  // Receives the clean formatted value whenever it changes.
  onCommit: (stored: string) => void;
}

interface UseMaskedInputResult {
  value: string;
  handleChange: (detail: MaskChangeDetail) => void;
  handleKeyPress: (detail: MaskKeyPressDetail) => void;
}

// Encapsulates masked-input state for a GoA input: display value, mount reflection, and change/keypress handling.
export const useMaskedInput = ({ mask, inPlace, data, onCommit }: UseMaskedInputOptions): UseMaskedInputResult => {
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

    if (!inPlace) {
      const stored = formatWithPattern(rawValue, mask);
      setValue(stored);
      onCommit(stored);
      return;
    }

    const target = getMaskInputTarget(detail);
    const caretIndex = target?.selectionStart ?? rawValue.length;
    const edit = computeMaskEdit(rawValue, caretIndex, mask);

    applyInPlaceEdit(target, edit);
    setValue(edit.display);
    onCommit(edit.stored);
  };

  // In-place mode has no native length cap, so block extra content characters at the source.
  const handleKeyPress = (detail: MaskKeyPressDetail) => {
    if (inPlace && /^[A-Za-z0-9]$/.test(detail.key) && isMaskFilled(value, mask)) {
      detail.event?.preventDefault();
    }
  };

  return { value, handleChange, handleKeyPress };
};
