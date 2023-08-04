import React from 'react';
import { GapAdjustment, HyperLinkColor } from '@pages/admin/dashboard/styled-components';
import { ExternalLink } from '@components/icons/ExternalLink';
import SupportLinks from '@components/SupportLinks';

interface AsideRightProps {
  serviceLink: string;
  docsLink?: string;
}

function AsideRight({ serviceLink, docsLink }: AsideRightProps): JSX.Element {
  return (
    <>
      <GapAdjustment>Helpful links</GapAdjustment>
      {serviceLink && (
        <HyperLinkColor>
          <ExternalLink link={serviceLink} text="See the code" />
        </HyperLinkColor>
      )}
      {docsLink && (
        <HyperLinkColor>
          <ExternalLink link={docsLink} text="Read the API docs" />
        </HyperLinkColor>
      )}
      <SupportLinks />
    </>
  );
}

export default AsideRight;
