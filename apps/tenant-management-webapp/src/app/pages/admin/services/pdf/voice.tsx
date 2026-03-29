import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoabButton } from '@abgov/react-components';
import { PdfMetrics } from './metrics';
import { useDispatch } from 'react-redux';
import { fetchPdfMetrics } from '@store/pdf/action';
import { OverviewLayout } from '@components/Overview';
import { useNavigate } from 'react-router-dom';
import { VoiceInputButton } from './VoiceInputButton';
export const Voice: FunctionComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const description =
    'The PDF service provides PDF operations like generating new PDFs from templates. It runs operations as asynchronous jobs and uploads the output PDF files to the file service.';
  return (
    <VoiceInputButton
      sttUrl="/api/voice/stt"
      mode="append"
      currentValue={prompt}
      onTranscript={(text) => setPrompt(text)}
    />
  );
};
