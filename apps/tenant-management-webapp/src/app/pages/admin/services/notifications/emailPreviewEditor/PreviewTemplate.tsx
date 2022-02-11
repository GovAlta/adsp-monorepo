import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';

import { SubjectPreview, BodyPreview } from './styled-components';
export const PreviewTemplate: FunctionComponent<any> = ({
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
