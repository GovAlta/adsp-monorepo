import React, { FunctionComponent } from 'react';
import { sanitizeHtml, phoneWrapper } from '../utils';
import { PreviewContainer, SubjectPreview, BodyPreview, SlackPreview, SMSBodyPreview } from './styled-components';

interface PreviewTemplateProps {
  channelTitle: string;
  subjectPreviewContent: string;
  bodyPreviewContent: string;
  channel: string;
  contactPhoneNumber?: string;
}

export const PreviewTemplate: FunctionComponent<PreviewTemplateProps> = ({
  channelTitle,
  subjectPreviewContent,
  bodyPreviewContent,
  channel,
  contactPhoneNumber,
}) => {
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
        <BodyPreview data-testid="email-preview-body" title={channelTitle} html={bodyPreviewContent}></BodyPreview>
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
        <SMSBodyPreview
          data-testid="sms-preview-body"
          subject={subjectPreviewContent}
          body={bodyPreviewContent}
        ></SMSBodyPreview>
      </>
    );
  };

  const BotPreview = () => {
    return (
      <>
        <h3>{channelTitle}</h3>
        <SlackPreview
          data-testid="bot-preview"
          subject={subjectPreviewContent}
          body={bodyPreviewContent}
        ></SlackPreview>
      </>
    );
  };

  const previewByType = {
    Email: <EmailPreview />,
    SMS: <SmsPreview />,
    Bot: <BotPreview />,
  };

  return <PreviewContainer>{previewByType[channel]}</PreviewContainer>;
};
