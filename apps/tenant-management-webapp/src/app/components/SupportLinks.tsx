import { EmailLinkColor, SpaceAdjust } from './styled-components';
import React from 'react';

import { GoAIcon } from '@abgov/react-components-new';

function SupportLinks(): JSX.Element {
  return (
    <>
      <SpaceAdjust>Support</SpaceAdjust>
      {
        <EmailLinkColor>
          <a rel="noopener noreferrer" target="_blank" href="mailto:adsp@gov.ab.ca">
            Get support
          </a>

          <GoAIcon data-testid="mail-icon" size="small" type="mail" />
        </EmailLinkColor>
      }
    </>
  );
}

export default SupportLinks;
