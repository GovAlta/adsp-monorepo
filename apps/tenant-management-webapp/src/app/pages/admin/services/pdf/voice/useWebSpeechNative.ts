import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DictationHook, DictationState } from './types';

function getCtor(): any | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useWebSpeechNative(lang = 'en-CA'): DictationHook {
  const Ctor = useMemo(() => (typeof window !== 'undefined' ? getCtor() : null), []);
  const isSupported = !!Ctor;

  const [state, setState] = useState<DictationState>('idle');
  const [error, setError] = useState('');
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');

  const recRef = useRef<any | null>(null);

  const start = useCallback(() => {
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser.');
      setState('error');
      return;
    }

    setError('');
    setFinalText('');
    setInterimText('');

    const rec = new Ctor();
    recRef.current = rec;

    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => setState('listening');
    rec.onerror = (e: any) => {
      setError(e?.error ?? 'Speech recognition error');
      setState('error');
    };
    rec.onend = () => setState('idle');

    rec.onresult = (event: any) => {
      let interim = '';
      let finals = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const txt = result[0]?.transcript ?? '';
        if (result.isFinal) finals += txt;
        else interim += txt;
      }

      if (interim) setInterimText(interim.trim());
      if (finals) {
        setFinalText(finals.trim());
        setInterimText('');
      }
    };

    rec.start();
  }, [Ctor, lang]);

  const stop = useCallback(() => {
    recRef.current?.stop?.();
  }, []);

  const reset = useCallback(() => {
    setError('');
    setFinalText('');
    setInterimText('');
    setState('idle');
  }, []);

  useEffect(() => {
    return () => {
      recRef.current?.stop?.();
      recRef.current = null;
    };
  }, []);

  return { isSupported, state, error, finalText, interimText, start, stop, reset };
}
