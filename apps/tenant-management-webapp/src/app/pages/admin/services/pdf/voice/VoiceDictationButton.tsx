import React, { useEffect, useRef } from 'react';
import { GoabIconButton } from '@abgov/react-components';
import { useDictation } from './useDictation';
import type { DictationState, SpeechEngine } from './types';

type Props = {
  engine: SpeechEngine;
  sttUrl?: string; // backend only
  mode?: 'replace' | 'append';
  currentValue?: string;
  disabled?: boolean;
  onText: (text: string) => void;
};

export function VoiceDictationButton({
  engine,
  sttUrl,
  mode = 'append',
  currentValue = '',
  disabled = false,
  onText,
}: Props) {
  const voice = useDictation({ engine, sttUrl, lang: 'en-CA', sttLanguage: 'en' });

  const prevStateRef = useRef<DictationState>('idle');
  const lastAppliedRef = useRef('');

  const apply = () => {
    const text = (voice.finalText ?? '').trim();
    if (!text) return;
    if (text === lastAppliedRef.current) return;
    lastAppliedRef.current = text;

    const next = mode === 'append' ? [currentValue, text].filter(Boolean).join(' ') : text;

    onText(next);
    voice.reset();
  };

  useEffect(() => {
    const prev = prevStateRef.current;
    const curr = voice.state;

    const finished = (prev === 'listening' || prev === 'transcribing') && curr === 'idle';
    if (finished) window.setTimeout(apply, 80);

    prevStateRef.current = curr;
  }, [voice.state, voice.finalText]);

  const title = voice.interimText ? `Voice (${voice.engineUsed}): ${voice.interimText}` : `Voice (${voice.engineUsed})`;

  return (
    <GoabIconButton
      icon={voice.state === 'listening' ? 'close-circle' : 'chevron-down'}
      title={title}
      size="medium"
      variant="dark"
      disabled={disabled || !voice.isSupported || voice.state === 'requesting'}
      onClick={() => {
        if (voice.state === 'listening') {
          voice.stop();
        } else {
          lastAppliedRef.current = '';
          voice.start();
        }
      }}
    />
  );
}
