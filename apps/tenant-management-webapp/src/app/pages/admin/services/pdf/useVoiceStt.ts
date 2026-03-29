// useVoiceStt.ts
import { useCallback, useMemo, useRef, useState } from 'react';

export type VoiceState = 'idle' | 'requesting' | 'recording' | 'transcribing' | 'error';

export type UseVoiceSttOptions = {
  sttUrl?: string; // default "/api/voice/stt"
  mimeType?: string; // default "audio/webm;codecs=opus" (Chrome/Edge)
  maxSeconds?: number; // auto-stop safety
  requestTimeoutMs?: number; // for transcription call
};

export type SttResponse = { transcript: string };

function pickSupportedMime(preferred: string): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  if (MediaRecorder.isTypeSupported(preferred)) return preferred;
  // fallbacks
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    window.clearTimeout(id);
  }
}

export function useVoiceStt(opts?: UseVoiceSttOptions) {
  const sttUrl = opts?.sttUrl ?? '/api/voice/stt';
  const maxSeconds = opts?.maxSeconds ?? 30;
  const requestTimeoutMs = opts?.requestTimeoutMs ?? 30_000;

  const chosenMime = useMemo(() => pickSupportedMime(opts?.mimeType ?? 'audio/webm;codecs=opus'), [opts?.mimeType]);

  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopTimerRef = useRef<number | null>(null);

  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' &&
    !!chosenMime;

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

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === 'recording') rec.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser.');
      setState('error');
      return;
    }

    setError(null);
    setTranscript('');
    setState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: chosenMime! });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // called after stopRecording()
        try {
          setState('transcribing');

          const blob = new Blob(chunksRef.current, { type: chosenMime! });
          chunksRef.current = [];

          const form = new FormData();
          form.append('audio', blob, 'speech.webm');

          const res = await fetchWithTimeout(sttUrl, { method: 'POST', body: form }, requestTimeoutMs);

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || `STT request failed (${res.status})`);
          }

          const json = (await res.json()) as SttResponse;
          const text = (json?.transcript ?? '').trim();

          setTranscript(text);
          setState('idle');
        } catch (e: any) {
          setError(e?.message ?? 'Transcription failed.');
          setState('error');
        } finally {
          cleanup();
        }
      };

      recorder.start(); // start collecting data
      setState('recording');

      // safety auto-stop
      stopTimerRef.current = window.setTimeout(() => stopRecording(), maxSeconds * 1000);
    } catch (e: any) {
      setError(e?.message ?? 'Microphone permission denied or unavailable.');
      setState('error');
      cleanup();
    }
  }, [chosenMime, cleanup, isSupported, maxSeconds, requestTimeoutMs, stopRecording, sttUrl]);

  const reset = useCallback(() => {
    setError(null);
    setTranscript('');
    setState('idle');
  }, []);

  return {
    isSupported,
    state,
    error,
    transcript,
    startRecording,
    stopRecording,
    reset,
  };
}
