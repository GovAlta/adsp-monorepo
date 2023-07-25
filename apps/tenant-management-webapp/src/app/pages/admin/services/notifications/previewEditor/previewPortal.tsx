import React, { FunctionComponent } from 'react';
import { sanitizeHtml } from '@lib/sanitize';

interface PreviewPortalProps {
  title: string;
  html: string;
  className?: string;
}

export const PreviewPortal: FunctionComponent<PreviewPortalProps> = ({ className, title, html }) => {
  const htmlDocument = sanitizeHtml(html, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] });

  return (
    <iframe
      sandbox=""
      data-testid="email-preview-body"
      className={className}
      title={title}
      seamless
      srcDoc={htmlDocument}
    />
  );
};
