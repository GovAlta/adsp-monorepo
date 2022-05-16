import React, { FunctionComponent } from 'react';
import { PreviewContainer, BodyPreview } from './styled-components';

interface PreviewTemplateProps {
  channelTitle: string;
  bodyPreviewContent: string;
}

export const PreviewTemplate: FunctionComponent<PreviewTemplateProps> = ({ channelTitle, bodyPreviewContent }) => {
  const PdfPreview = () => {
    return (
      <>
        <h3>{channelTitle}</h3>
        <BodyPreview title={channelTitle} html={bodyPreviewContent}></BodyPreview>
      </>
    );
  };

  return (
    <PreviewContainer>
      <PdfPreview />
    </PreviewContainer>
  );
};
