import React, { useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import SupportLinks from '@components/SupportLinks';
import { Tab, Tabs } from '@components/Tabs';
import { Overview } from './overview';
import { ServiceRoles } from './serviceRoles';

export default function (): JSX.Element {
  // eslint-disable-next-line
  const [activeIndex, setActiveIndex] = useState<number>(0);

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
        <h3>Helpful links</h3>
        <a rel="noopener noreferrer" target="_blank" href="https://github.com/GovAlta/access-service">
          See the code
        </a>
        <SupportLinks />
      </Aside>
    </Page>
  );
}
