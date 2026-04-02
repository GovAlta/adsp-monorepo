import { useCallback, useMemo, useRef, useState } from 'react';

export type VoiceState = 'idle' | 'requesting' | 'recording' | 'transcribing' | 'error';
export type SttResponse = { transcript: string; error?: string };

function pickSupportedMime(preferred: string): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  if (MediaRecorder.isTypeSupported(preferred)) return preferred;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export function useVoiceStt(sttUrl = '/api/voice/stt', maxSeconds = 30) {
  const mimeType = useMemo(() => pickSupportedMime('audio/webm;codecs=opus'), []);
  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' &&
    !!mimeType;

  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopTimerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state === 'recording') rec.stop();
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser.');
      setState('error');
      return;
    }

    setError('');
    setTranscript('');
    setState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: mimeType! });
      recorderRef.current = rec;

      rec.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);

      rec.onstop = async () => {
        try {
          setState('transcribing');
          const blob = new Blob(chunksRef.current, { type: mimeType! });
          chunksRef.current = [];

          const form = new FormData();
          form.append('audio', blob, 'speech.webm');

          const res = await fetch(sttUrl, { method: 'POST', body: form });
          const json = (await res.json().catch(() => ({}))) as SttResponse;

          if (!res.ok) throw new Error(json.error || `STT failed (${res.status})`);

          setTranscript((json.transcript ?? '').trim());
          setState('idle');
        } catch (e: any) {
          setError(e?.message ?? 'Transcription failed.');
          setState('error');
        } finally {
          cleanup();
        }
      };

      rec.start();
      setState('recording');

      stopTimerRef.current = window.setTimeout(() => stop(), maxSeconds * 1000);
    } catch (e: any) {
      setError(e?.message ?? 'Microphone permission denied/unavailable.');
      setState('error');
      cleanup();
    }
  }, [cleanup, isSupported, maxSeconds, mimeType, stop, sttUrl]);

  const reset = useCallback(() => {
    setError('');
    setTranscript('');
    setState('idle');
  }, []);

  return { isSupported, state, error, transcript, start, stop, reset };
}
