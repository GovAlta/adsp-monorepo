import React from 'react';
import { GoAIcon } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
interface ExternalLinkProps {
  text: string;
  link: string;
  testId?: string;
}

const ExternalLinkWrapper = styled.div`
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
      {/* <GoAIcon size="medium" data-testid="open-icon" type="open" /> */}
    </ExternalLinkWrapper>
  );
};
