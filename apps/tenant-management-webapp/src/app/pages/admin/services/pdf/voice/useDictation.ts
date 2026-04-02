import { useMemo } from 'react';
import type { SpeechEngine } from './types';
import { useWebSpeechNative } from './useWebSpeechNative';
import { useWebSpeechRSR } from './useWebSpeechRSR';
import { useBackendMastraStt } from './useBackendMastraStt';

export type DictationResult = ReturnType<typeof useDictation>;

export function useDictation(opts: {
  engine: SpeechEngine;
  lang?: string; // for web speech
  sttUrl?: string; // for backend
  sttLanguage?: string; // for backend
}) {
  const native = useWebSpeechNative(opts.lang ?? 'en-CA');
  const rsr = useWebSpeechRSR(opts.lang ?? 'en-CA');
  const backend = useBackendMastraStt({
    sttUrl: opts.sttUrl ?? 'http://localhost:3001/api/voice/stt',
    language: opts.sttLanguage ?? 'en',
    maxSeconds: 20,
  });

  return useMemo(() => {
    if (opts.engine === 'mastra-backend') return { ...backend, engineUsed: 'mastra-backend' as const };
    if (opts.engine === 'rsr') return { ...rsr, engineUsed: 'rsr' as const };
    if (opts.engine === 'native') return { ...native, engineUsed: 'native' as const };

    // auto: prefer RSR, fallback native (auto 不默认 backend)
    if (rsr.isSupported) return { ...rsr, engineUsed: 'rsr' as const };
    return { ...native, engineUsed: 'native' as const };
  }, [opts.engine, backend, native, rsr]);
}
