import { EmailLinkColor, SpaceAdjust } from './styled-components';
import React from 'react';
import { GoAContextMenuIcon } from '@components/ContextMenu';

function SupportLinks(): JSX.Element {
  return (
    <>
      <SpaceAdjust>Support</SpaceAdjust>
      {
        <EmailLinkColor data-testid="support-link">
          <a rel="noopener noreferrer" target="_blank" href="mailto:adsp@gov.ab.ca">
            Get support
            <GoAContextMenuIcon type="mail" title="Email" testId="mail-icon" />
          </a>
        </EmailLinkColor>
      }
    </>
  );
}

export default SupportLinks;
