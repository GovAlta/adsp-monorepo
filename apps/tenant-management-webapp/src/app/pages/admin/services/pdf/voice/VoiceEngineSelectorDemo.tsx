import React, { useState } from 'react';
import type { SpeechEngine } from './types';
import { VoiceDictationButton } from './VoiceDictationButton';

export function VoiceEngineSelectorDemo() {
  const [engine, setEngine] = useState<SpeechEngine>('auto');
  const [value, setValue] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <br />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, opacity: 0.8 }}>Voice engine</label>
        <br />
        <select value={engine} onChange={(e) => setEngine(e.target.value as SpeechEngine)}>
          <option value="auto">Auto</option>
          <option value="rsr">Web Speech (RSR)</option>
          <option value="native">Web Speech (Native)</option>
          <option value="mastra-backend">Backend STT (Mastra)</option>
        </select>
      </div>
      <br />
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ flex: 1 }} value={value} onChange={(e) => setValue(e.target.value)} />
        <VoiceDictationButton
          engine={engine}
          sttUrl="http://localhost:3001/api/voice/stt"
          mode="replace"
          currentValue={value}
          onText={setValue}
        />
      </div>
    </div>
  );
}
