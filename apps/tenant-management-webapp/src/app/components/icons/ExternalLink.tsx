import React from 'react';
import { GoAIcon } from '@abgov/react-components/experimental';
import styled from 'styled-components';

interface ExternalLinkProps {
  text: string;
  link: string;
  testId?: string;
}

const ExternalLinkWrapper = styled.div`
  display: inline-block;
  .goa-icon {
    display: inline-block !important;
    position: relative;
    top: 3px;
    right: 2px;
    color: #0070c4;
  }
`;
export const ExternalLink = ({ text, testId, link }: ExternalLinkProps): JSX.Element => {
  return (
    <ExternalLinkWrapper data-testid={`${testId}`}>
      <GoAIcon type="open" />
      <a href={link} rel="noopener noreferrer" target="_blank">
        {text}
      </a>
    </ExternalLinkWrapper>
  );
};
