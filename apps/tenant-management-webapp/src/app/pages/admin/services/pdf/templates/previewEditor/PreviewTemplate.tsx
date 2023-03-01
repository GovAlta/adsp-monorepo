import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components-new';
import { GoAElementLoader } from '@abgov/react-components';
import {
  GenerateButtonPadding,
  SpinnerPadding,
  SpinnerSpace,
  PreviewTopStyle,
  PreviewContainer,
} from '../../styled-components';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';

interface PreviewTemplateProps {
  channelTitle: string;
  generateTemplate: () => void;
}

const base64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export const PreviewTemplate: FunctionComponent<PreviewTemplateProps> = ({ channelTitle, generateTemplate }) => {
  const [windowSize, setWindowSize] = useState([window.innerWidth, window.innerHeight]);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const files = useSelector((state: RootState) => {
    return state?.pdf.files;
  });

  const currentId = useSelector((state: RootState) => {
    return state?.pdf.currentId;
  });

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight]);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  });

  const PreviewPreview = () => {
    const blob = files[currentId] && base64toBlob(files[currentId], 'application/pdf');

    const blobUrl = blob && URL.createObjectURL(blob);
    return (
      <>
        <PreviewTop title={channelTitle} />
        {blobUrl && (
          <div>
            <div>
              <object type="application/pdf" data={blobUrl} height={windowSize[1] - 200} style={{ width: '100%' }}>
                <iframe src={blobUrl} height="100%" width="100%"></iframe>
              </object>
            </div>
          </div>
        )}
      </>
    );
  };

  const PreviewTop = ({ title }) => {
    return (
      <PreviewTopStyle>
        <h3>{title}</h3>
        <GoAButton
          disabled={indicator.show}
          type="secondary"
          data-testid="form-save"
          onClick={() => {
            generateTemplate();
          }}
        >
          <GenerateButtonPadding>
            Generate PDF
            {indicator.show ? (
              <SpinnerPadding>
                <GoAElementLoader visible={true} size="default" baseColour="#c8eef9" spinnerColour="#0070c4" />
              </SpinnerPadding>
            ) : (
              <SpinnerSpace></SpinnerSpace>
            )}
          </GenerateButtonPadding>
        </GoAButton>
      </PreviewTopStyle>
    );
  };

  return (
    <PreviewContainer>
      <PreviewPreview />
    </PreviewContainer>
  );
};
