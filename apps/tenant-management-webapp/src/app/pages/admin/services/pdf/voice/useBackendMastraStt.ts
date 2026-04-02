import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DictationHook, DictationState } from './types';

type Options = {
  sttUrl: string;
  language?: string; // "en"
  maxSeconds?: number; // auto-stop
};

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export function useBackendMastraStt(opts: Options): DictationHook {
  const mimeType = useMemo(() => pickMime(), []);
  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' &&
    !!mimeType;

  const [state, setState] = useState<DictationState>('idle');
  const [error, setError] = useState('');
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    recRef.current = null;
    chunksRef.current = [];
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const transcribe = useCallback(async () => {
    try {
      setState('transcribing');
      setInterimText('Transcribing…');
      setError('');

      const blob = new Blob(chunksRef.current, { type: mimeType! });
      chunksRef.current = [];

      const form = new FormData();
      form.append('audio', blob, 'speech.webm');
      form.append('language', opts.language ?? 'en');

      const res = await fetch(opts.sttUrl, { method: 'POST', body: form });
      const json = await res.json().catch(() => ({}) as any);

      if (!res.ok) throw new Error(json?.error || `STT failed (${res.status})`);

      setFinalText((json?.transcript ?? '').trim());
      setInterimText('');
      setState('idle');
    } catch (e: any) {
      setInterimText('');
      setError(e?.message ?? 'Backend STT failed.');
      setState('error');
    } finally {
      cleanup();
    }
  }, [cleanup, mimeType, opts.language, opts.sttUrl]);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (rec && rec.state === 'recording') rec.stop();
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError('MediaRecorder is not supported in this browser.');
      setState('error');
      return;
    }

    setError('');
    setFinalText('');
    setInterimText('');
    setState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const rec = new MediaRecorder(stream, { mimeType: mimeType! });
      recRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);
      rec.onstart = () => {
        setState('listening');
        setInterimText('Listening…');
      };
      rec.onstop = () => transcribe();

      rec.start();

      const maxSeconds = opts.maxSeconds ?? 20;
      timerRef.current = window.setTimeout(() => stop(), maxSeconds * 1000);
    } catch (e: any) {
      setError(e?.message ?? 'Microphone permission denied/unavailable.');
      setState('error');
      cleanup();
    }
  }, [cleanup, isSupported, mimeType, opts.maxSeconds, stop, transcribe]);

  const reset = useCallback(() => {
    setError('');
    setFinalText('');
    setInterimText('');
    setState('idle');
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { isSupported, state, error, finalText, interimText, start, stop, reset };
}
