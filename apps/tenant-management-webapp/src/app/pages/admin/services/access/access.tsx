import React, { useState } from 'react';
import { Aside, Main, Page, AsidePadding } from '@components/Html';
import AsideLinks from '@components/AsideLinks';
import { Tab, Tabs } from '@components/Tabs';
import { Overview } from './overview';
import { ServiceRoles } from './serviceRoles';
import { TenantIdp } from './TenantIDP';
import { AccessServiceAgent } from './AccessServiceAgent';
import { TokenHandlerTab } from './tokenHandler/TokenHandlerTab';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

export default function (): JSX.Element {
  // eslint-disable-next-line
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const accessServiceAIEnabled = useSelector((state: RootState) => state.config.featureFlags?.AccessServiceAI === true);

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

          <Tab label="Token handler" data-testid="access-token-handler-tab">
            <TokenHandlerTab />
          </Tab>

          {accessServiceAIEnabled && (
            <Tab label="AI agent" testId="access-ai-agent">
              <AccessServiceAgent />
            </Tab>
          )}
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
