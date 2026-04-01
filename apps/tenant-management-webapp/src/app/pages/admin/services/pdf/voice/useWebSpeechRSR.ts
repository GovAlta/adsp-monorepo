import { useCallback, useMemo } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import type { DictationHook, DictationState } from './types';

export function useWebSpeechRSR(lang = 'en-CA'): DictationHook {
  const {
    transcript,
    finalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const isSupported = useMemo(
    () => !!browserSupportsSpeechRecognition && !!isMicrophoneAvailable,
    [browserSupportsSpeechRecognition, isMicrophoneAvailable],
  );

  const start = useCallback(async () => {
    resetTranscript();
    await SpeechRecognition.startListening({
      continuous: false,
      language: lang,
      interimResults: true,
    } as any);
  }, [lang, resetTranscript]);

  const stop = useCallback(() => SpeechRecognition.stopListening(), []);
  const reset = useCallback(() => resetTranscript(), [resetTranscript]);

  const state: DictationState = listening ? 'listening' : 'idle';

  return {
    isSupported,
    state,
    error: '',
    finalText: (finalTranscript ?? '').trim(),
    interimText: (transcript ?? '').trim(),
    start,
    stop,
    reset,
  };
}
