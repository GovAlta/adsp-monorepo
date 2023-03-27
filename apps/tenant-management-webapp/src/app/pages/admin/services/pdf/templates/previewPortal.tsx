import React from 'react';
import { sanitizeHtml } from '@lib/sanitize';

interface PreviewPortalProps {
  title: string;
  html: string;
  className?: string;
}

export const PreviewPortal = ({ className, title, html }: PreviewPortalProps) => {
  return (
    <iframe
      sandbox=""
      className={className}
      title={title}
      srcDoc={sanitizeHtml(html, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] })}
    />
  );
};
