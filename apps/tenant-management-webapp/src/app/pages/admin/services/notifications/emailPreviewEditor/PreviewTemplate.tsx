import React, { FunctionComponent } from 'react';
import { SubjectPreview, BodyPreview } from './styled-components';

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
    <div>
      <h3>{subjectTitle}</h3>
      <SubjectPreview
        dangerouslySetInnerHTML={{
          __html: subjectPreviewContent,
        }}
      ></SubjectPreview>
      <h3>{emailTitle}</h3>
      <BodyPreview
        dangerouslySetInnerHTML={{
          __html: emailPreviewContent,
        }}
      ></BodyPreview>
    </div>
  );
};
