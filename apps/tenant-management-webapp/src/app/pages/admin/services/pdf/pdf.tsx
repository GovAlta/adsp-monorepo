import React, { FunctionComponent, useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { PdfOverview } from './overview';
import { PdfTemplates } from './templates/templates';
import SupportLinks from '@components/SupportLinks';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { Gapadjustment, Hyperlinkcolor } from '@pages/admin/dashboard/styled-components';
import { ExternalLink } from '@components/icons/ExternalLink';

export const Pdf: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const [openAddTemplate, setOpenAddTemplate] = useState(false);

  const searchParams = new URLSearchParams(document.location.search);

  const templates = tenantName && searchParams.get('templates');
  function getPdfDocsLink() {
    return `${docBaseUrl}/${tenantName?.replace(/ /g, '-')}?urls.primaryName=PDF service`;
  }
  function getPdfsupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/pdf-service';
  }
  return (
    <Page>
      <Main>
        <h1 data-testid="pdf-service-title">PDF service</h1>
        <Tabs activeIndex={templates === 'true' ? 1 : 0}>
          <Tab label="Overview">
            <PdfOverview setOpenAddTemplate={setOpenAddTemplate} />
          </Tab>
          <Tab label="Templates">
            <PdfTemplates openAddTemplate={openAddTemplate} />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <>
          <Gapadjustment>Helpful links</Gapadjustment>
          <Hyperlinkcolor>
            <ExternalLink link={getPdfDocsLink()} text="Read the API docs" />
          </Hyperlinkcolor>

          <Hyperlinkcolor>
            <ExternalLink link={getPdfsupportcodeLink()} text="See the code" />
          </Hyperlinkcolor>

          <SupportLinks />
        </>
      </Aside>
    </Page>
  );
};
