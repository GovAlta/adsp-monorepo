import React from 'react';
import { GapAdjustment, HyperLinkColor } from '@pages/admin/dashboard/styled-components';
import { ExternalLink } from '@components/icons/ExternalLink';
import SupportLinks from '@components/SupportLinks';

interface AsideLinksProps {
  serviceLink: string;
  docsLink?: string;
}

function AsideLinks({ serviceLink, docsLink }: AsideLinksProps): JSX.Element {
  return (
    <>
      <GapAdjustment>Helpful links</GapAdjustment>
      {serviceLink && (
        <HyperLinkColor>
          <ExternalLink testId="code-link" link={serviceLink} text="See the code" />
        </HyperLinkColor>
      )}
      {docsLink && (
        <HyperLinkColor>
          <ExternalLink link={docsLink} testId="docs-link" text="Read the API docs" />
        </HyperLinkColor>
      )}
      <SupportLinks />
    </>
  );
}

export default AsideLinks;
