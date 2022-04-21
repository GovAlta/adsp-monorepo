import React, { FunctionComponent } from 'react';
import SlackProfileIcon from '@assets/slack.png';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface SlackPreviewPortalProps {
  body: string;
  subject: string;
}

export const SlackPreviewPortal: FunctionComponent<SlackPreviewPortalProps> = ({ subject, body }) => {
  const TextContent = () => {
    const time = new Date();
    return (
      <div className="flexColumn">
        <div className="appNotificationHeader">
          <b className="adspHeader">ADSP Notifications</b>
          <div className="appBadge">APP</div>
          <div className="appTime">
            {time.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </div>
        </div>
        <b>
          <ReactMarkdown children={subject} rehypePlugins={[rehypeRaw]} />
        </b>
        <ReactMarkdown children={body} rehypePlugins={[rehypeRaw]} />
      </div>
    );
  };

  return (
    <SlackPreviewPortalStyles>
      <div className="slackPortalStyles">
        <img className="iconStyle" src={SlackProfileIcon} alt="profilePicture" />
        <TextContent />
      </div>
    </SlackPreviewPortalStyles>
  );
};

const SlackPreviewPortalStyles = styled.div`
  .slackPortalStyles {
    background-color: white;
    display: flex;
    flex-direction: row;
  }

  .iconStyle {
    margin: 15px 15px 15px 15px;
    border-radius: 4px;
    height: 40px;
    width: 40px;
  }

  .flexColumn {
    display: flex;
    flex-direction: column;
  }

  .appNotificationHeader {
    display: flex;
    flex-direction: row;
    margin-top: 15px;
  }

  .appBadge {
    background: #dddddd;
    border-radius: 3px;
    font-size: 0.8rem;
    margin-top: 4px;
    padding: 1px 3px;
    color: #555;
  }

  .appTime {
    color: #777;
    font-size: 0.8rem;
    margin: 5px 0 0 6px;
    font-weight: 600;
  }

  .adspHeader {
    margin: 0 10px 0px 0px;
  }

  .marginBottom {
    margin: 0 0 8px 0;
  }
`;
