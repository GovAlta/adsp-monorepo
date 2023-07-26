import React, { useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { Overview } from './overview';
import { ServiceRoles } from './serviceRoles';
import { Hyperlinkcolor, Spaceadjust } from '@pages/admin/dashboard/styled-components';
import { ExternalLink } from '@components/icons/ExternalLink';

export default function (): JSX.Element {
  // eslint-disable-next-line
  const [activeIndex, setActiveIndex] = useState<number>(0);

  function getAccessServiceLink() {
    return 'https://github.com/GovAlta/access-service';
  }
  return (
    <Page>
      <Main>
        <h1 data-testid="access-title">Access service</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview">
            <Overview />
          </Tab>

          <Tab label="Service roles">
            <ServiceRoles />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <Spaceadjust>Helpful links</Spaceadjust>
        <Hyperlinkcolor>
          <ExternalLink link={getAccessServiceLink()} text="See the code" />
        </Hyperlinkcolor>
        <div>&nbsp;</div>
        <SupportLinks />
      </Aside>
    </Page>
  );
}
