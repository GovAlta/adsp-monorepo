import React from 'react';
import styled from 'styled-components';
import { GoAContextMenuIcon } from '@components/ContextMenu';
interface ExternalLinkProps {
  text: string;
  link: string;
  testId?: string;
}

const ExternalLinkWrapper = styled.span`
  display: inline-block;
  color: #0070c4;
  .goa-icon {
    display: inline-block !important;
    position: relative;
    top: 3px;
    right: 2px;
    color: #0070c4;
    margin-left: 4px;
  }
`;
export const ExternalLink = ({ text, testId, link }: ExternalLinkProps): JSX.Element => {
  return (
    <ExternalLinkWrapper data-testid={`${testId}`}>
      <a href={link} rel="noopener noreferrer" target="_blank">
        {text}

        <GoAContextMenuIcon type="open" title="Open" testId="open-icon" />
      </a>
    </ExternalLinkWrapper>
  );
};
