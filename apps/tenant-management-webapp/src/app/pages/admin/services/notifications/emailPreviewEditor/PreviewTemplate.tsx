import React, { FunctionComponent } from 'react';
import { sanitizeHtml } from '../utils';
import { PreviewContainer, SubjectPreview, BodyPreview } from './styled-components';

interface PreviewTemplateProps {
  subjectTitle: string;
  emailTitle: string;
  subjectPreviewContent: string;
  emailPreviewContent: string;
}

export const PreviewTemplate: FunctionComponent<PreviewTemplateProps> = ({
  subjectTitle,
  emailTitle,
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
      <h3>{emailTitle}</h3>
      <BodyPreview title="Email preview" html={emailPreviewContent}></BodyPreview>
    </PreviewContainer>
  );
};
