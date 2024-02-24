import React from 'react';
import { phoneWrapper } from '../utils';
import { PreviewContainer, SubjectPreview, BodyPreview, SlackPreview, SMSBodyPreview } from './styled-components';
import { sanitizeHtml } from '@lib/sanitize';
interface PreviewTemplateProps {
  subjectPreviewContent: string;
  bodyPreviewContent: string;
  channel: string;
  contactPhoneNumber?: string;
}

export const PreviewTemplate = React.memo<PreviewTemplateProps>(
  ({ subjectPreviewContent, bodyPreviewContent, channel, contactPhoneNumber }) => {
    const channelTitle = `${channel} preview`;
    const EmailPreview = () => {
      return (
        <>
          <h3>Subject</h3>
          <SubjectPreview
            data-testid="email-preview-subject"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(subjectPreviewContent),
            }}
          ></SubjectPreview>
          <h3>{channelTitle}</h3>
          <BodyPreview title={channelTitle} html={bodyPreviewContent}></BodyPreview>
        </>
      );
    };

    const SmsPreview = () => {
      return (
        <>
          <h3>Sender’s number/short code</h3>
          <SubjectPreview
            data-testid="sms-preview-subject"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(phoneWrapper(contactPhoneNumber)),
            }}
          ></SubjectPreview>
          <h3>{channelTitle}</h3>
          <SMSBodyPreview subject={subjectPreviewContent} body={bodyPreviewContent}></SMSBodyPreview>
        </>
      );
    };

    const BotPreview = () => {
      return (
        <>
          <h3>{channelTitle}</h3>
          <SlackPreview subject={subjectPreviewContent} body={bodyPreviewContent}></SlackPreview>
        </>
      );
    };

    const previewByType = {
      Email: <EmailPreview />,
      SMS: <SmsPreview />,
      Bot: <BotPreview />,
    };

    return <PreviewContainer>{previewByType[channel]}</PreviewContainer>;
  }
);
