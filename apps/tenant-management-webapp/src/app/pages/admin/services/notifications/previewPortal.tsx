import React, { FunctionComponent } from 'react';
import { sanitizeHtml } from './utils';

interface PreviewPortalProps {
  title: string;
  html: string;
  className?: string;
}

export const PreviewPortal: FunctionComponent<PreviewPortalProps> = ({ className, title, html }) => {
  return (
    <iframe
      data-testid="email-preview-body"
      className={className}
      title={title}
      srcDoc={sanitizeHtml(html, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] })}
    />
  );
};
