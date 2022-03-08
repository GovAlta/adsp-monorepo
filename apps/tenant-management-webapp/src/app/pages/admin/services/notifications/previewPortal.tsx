import React, { FunctionComponent } from 'react';
import DOMPurify from 'dompurify';

interface PreviewPortalProps {
  title: string;
  html: string;
  className?: string;
}

export const PreviewPortal: FunctionComponent<PreviewPortalProps> = ({ className, title, html }) => {
  return (
    <iframe
      className={className}
      title={title}
      srcDoc={DOMPurify.sanitize(html, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] })}
    />
  );
};
