// VoiceInputButton.tsx
import React, { useEffect } from 'react';
import { useVoiceStt } from './useVoiceStt';

type Props = {
  sttUrl?: string;
  onTranscript: (text: string) => void;
  mode?: 'replace' | 'append';
  currentValue?: string; // used when mode="append"
};

export function VoiceInputButton({ sttUrl, onTranscript, mode = 'replace', currentValue = '' }: Props) {
  const voice = useVoiceStt({ sttUrl });

  useEffect(() => {
    if (voice.transcript) {
      const next = mode === 'append' ? [currentValue, voice.transcript].filter(Boolean).join(' ') : voice.transcript;

      onTranscript(next);
      // optional: clear transcript after applying
      voice.reset();
    }
  }, [voice.transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = voice.state === 'recording' ? 'Stop' : voice.state === 'transcribing' ? 'Transcribing…' : 'Speak';

  return (
    <button
      type="button"
      disabled={!voice.isSupported || voice.state === 'requesting' || voice.state === 'transcribing'}
      onClick={() => {
        if (voice.state === 'recording') voice.stopRecording();
        else voice.startRecording();
      }}
      aria-label="Voice input"
      title={!voice.isSupported ? 'Voice input not supported' : 'Voice input'}
    >
      {label}
      {voice.error ? ` (${voice.error})` : ''}
    </button>
  );
}
