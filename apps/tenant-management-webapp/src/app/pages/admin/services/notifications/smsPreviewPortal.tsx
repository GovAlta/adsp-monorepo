import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { sanitizeHtml } from './utils';

interface SmsPreviewPortalProps {
  body: string;
  subject: string;
}

export const SmsPreviewPortal: FunctionComponent<SmsPreviewPortalProps> = ({ subject, body }) => {
  const TextContent = () => {
    return (
      <div data-testid="sms-preview-body" className="flexColumn">
        <div
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(subject, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] }),
          }}
        ></div>

        <div
          className="marginBottom"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(body, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] }) }}
        ></div>
      </div>
    );
  };

  return (
    <SmsPreviewPortalStyles>
      <div className="smsPortalStyles">
        <TextContent />
      </div>
    </SmsPreviewPortalStyles>
  );
};

const SmsPreviewPortalStyles = styled.div`
  .smsPortalStyles {
    background-color: white;
    display: flex;
    flex-direction: row;
  }
  .flexColumn {
    display: flex;
    flex-direction: column;
    margin-left: 8px;
  }

  .marginBottom {
    margin: 0 0 8px 0;
  }
`;
