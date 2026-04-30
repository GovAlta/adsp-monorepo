import React, { useState } from 'react';
import { Aside, Main, Page, AsidePadding } from '@components/Html';
import AsideLinks from '@components/AsideLinks';
import { Tab, Tabs } from '@components/Tabs';
import { Overview } from './overview';
import { ServiceRoles } from './serviceRoles';
import { TenantIdp } from './TenantIDP';

export default function (): JSX.Element {
  // eslint-disable-next-line
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <Page>
      <Main>
        <h1 data-testid="access-title">Access service</h1>
        <Tabs activeIndex={activeIndex} data-testid="access-tabs">
          <Tab label="Overview" data-testid="access-overview-tab">
            <Overview />
          </Tab>

          <Tab label="Service roles" data-testid="service-roles-tab">
            <ServiceRoles />
          </Tab>

          <Tab label="Troubleshooting" data-testid="service-ADSP-idp">
            <TenantIdp />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <AsidePadding>
          <AsideLinks serviceName="Access" noDocsLink={true} />
        </AsidePadding>
      </Aside>
    </Page>
  );
}
