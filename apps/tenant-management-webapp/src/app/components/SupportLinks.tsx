import { Emailinkcolor, Spaceadjust } from '@pages/admin/dashboard/styled-components';
import React from 'react';

import { GoAIcon } from '@abgov/react-components-new';

function SupportLinks(): JSX.Element {
  return (
    <>
      <Spaceadjust>Support</Spaceadjust>
      {
        <Emailinkcolor>
          <a rel="noopener noreferrer" target="_blank" href="mailto:adsp@gov.ab.ca">
            Get support
          </a>

          <GoAIcon data-testid="mail-icon" size="small" type="mail" />
        </Emailinkcolor>
      }
    </>
  );
}

export default SupportLinks;
