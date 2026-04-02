export type DictationState = 'idle' | 'requesting' | 'listening' | 'transcribing' | 'error';
export type SpeechEngine = 'auto' | 'rsr' | 'native' | 'mastra-backend';

export type DictationHook = {
  isSupported: boolean;
  state: DictationState;
  error: string;
  finalText: string;
  interimText: string;
  start: () => void | Promise<void>;
  stop: () => void;
  reset: () => void;
};
