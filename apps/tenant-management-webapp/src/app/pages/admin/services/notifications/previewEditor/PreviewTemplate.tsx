import React, { FunctionComponent } from 'react';
import { sanitizeHtml } from '../utils';
import { PreviewContainer, SubjectPreview, BodyPreview } from './styled-components';

interface PreviewTemplateProps {
  subjectTitle: string;
  channelTitle: string;
  subjectPreviewContent: string;
  emailPreviewContent: string;
}

export const PreviewTemplate: FunctionComponent<PreviewTemplateProps> = ({
  subjectTitle,
  channelTitle,
  subjectPreviewContent,
  emailPreviewContent,
}) => {
  return (
    <PreviewContainer>
      <h3>{subjectTitle}</h3>
      <SubjectPreview
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(subjectPreviewContent),
        }}
      ></SubjectPreview>
      <h3>{channelTitle}</h3>
      <BodyPreview title={channelTitle} html={emailPreviewContent}></BodyPreview>
    </PreviewContainer>
  );
};
