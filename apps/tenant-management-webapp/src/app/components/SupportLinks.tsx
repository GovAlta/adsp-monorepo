import { Emailinkcolor } from '@pages/admin/dashboard/styled-components';
import React from 'react';

import EmailIcon from '@components/icons/EmailIcon';

function SupportLinks(): JSX.Element {
  return (
    <>
      <h3>Support</h3>
      {
        <Emailinkcolor>
          <a rel="noopener noreferrer" target="_blank" href="mailto:adsp@gov.ab.ca">
            Get support
            <EmailIcon size={'small'} />
          </a>
        </Emailinkcolor>
      }
    </>
  );
}

export default SupportLinks;
