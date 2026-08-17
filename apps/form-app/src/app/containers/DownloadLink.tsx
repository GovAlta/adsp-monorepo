import React from 'react';
import styled from 'styled-components';
import { GoabIconButton } from '@abgov/react-components';

interface ExternalLinkProps {
  text: string;
  link: () => Promise<void>;
  testId?: string;
}

const ExternalLinkWrapper = styled.span`
  .goa-icon {
    display: inline-block !important;
    position: relative;
    top: 3px;
    right: 2px;
    color: #0070c4;
    margin-left: 4px;
  }

  .link {
    display: flex;
    color: #0070c4;
    width: fit-content;
  }

  .text {
    text-decoration: underline;
  }

  .link:hover {
    cursor: pointer;
  }
`;
export const DownloadLink = ({ text, testId, link }: ExternalLinkProps): JSX.Element => {
  return (
    <ExternalLinkWrapper data-testid={`${testId}`}>
      <div className="link" onClick={() => link()}>
        <div className="text">{text}</div>
        <GoabIconButton icon="download" testId="download-icon" title="Download" size="small" />
      </div>
    </ExternalLinkWrapper>
  );
};
