import { EmailLinkColor, SpaceAdjust } from './styled-components';
import React from 'react';
import { useSelector } from 'react-redux';
import { selectSupportEmail } from '@store/config/selectors';
import { GoAContextMenuIcon } from '@components/ContextMenu';

function SupportLinks(): JSX.Element {
  const supportEmail = useSelector(selectSupportEmail);

  return (
    <>
      <SpaceAdjust>Support</SpaceAdjust>
      {
        <EmailLinkColor data-testid="support-link">
          <a rel="noopener noreferrer" target="_blank" href={`mailto:${supportEmail}`}>
            Get support
            <GoAContextMenuIcon type="mail" title="Email" testId="mail-icon" />
          </a>
        </EmailLinkColor>
      }
    </>
  );
}

export default SupportLinks;
