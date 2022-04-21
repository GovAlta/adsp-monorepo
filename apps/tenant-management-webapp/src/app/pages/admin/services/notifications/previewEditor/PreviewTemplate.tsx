import React, { FunctionComponent } from 'react';
import { sanitizeHtml } from '../utils';
import { PreviewContainer, SubjectPreview, BodyPreview, SlackPreview } from './styled-components';

interface PreviewTemplateProps {
  subjectTitle: string;
  channelTitle: string;
  subjectPreviewContent: string;
  bodyPreviewContent: string;
  channel: string;
}

export const PreviewTemplate: FunctionComponent<PreviewTemplateProps> = ({
  subjectTitle,
  channelTitle,
  subjectPreviewContent,
  bodyPreviewContent,
  channel,
}) => {
  const EmailPreview = () => {
    return (
      <>
        <h3>{subjectTitle}</h3>
        <SubjectPreview
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
        <h3>{subjectTitle}</h3>
        <SubjectPreview
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(subjectPreviewContent),
          }}
        ></SubjectPreview>
        <h3>{channelTitle}</h3>
        <BodyPreview title={channelTitle} html={bodyPreviewContent}></BodyPreview>
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
    'Text message': <SmsPreview />,
    'Slack bot': <BotPreview />,
  };

  return <PreviewContainer>{previewByType[channel]}</PreviewContainer>;
};
