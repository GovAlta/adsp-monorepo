import React, { FunctionComponent, useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { PdfOverview } from './overview';
import { PdfTemplates } from './templates/templates';

import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

import AsideLinks from '@components/AsideLinks';

export const Pdf: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);

  const [openAddTemplate, setOpenAddTemplate] = useState(false);

  const searchParams = new URLSearchParams(document.location.search);

  const templates = tenantName && searchParams.get('templates');

  return (
    <Page>
      <Main>
        <h1 data-testid="pdf-service-title">PDF service</h1>
        <Tabs activeIndex={templates === 'true' ? 1 : 0} data-testid="pdf-service-tabs">
          <Tab label="Overview" data-testid="pdf-service-overview-tab">
            <PdfOverview setOpenAddTemplate={setOpenAddTemplate} />
          </Tab>
          <Tab label="Templates" data-testid="pdf-service-tenplates-tab">
            <PdfTemplates openAddTemplate={openAddTemplate} />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <AsideLinks serviceName="pdf" />
      </Aside>
    </Page>
  );
};
