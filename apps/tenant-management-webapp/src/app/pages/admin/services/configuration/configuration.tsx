import React, { FunctionComponent, useEffect, useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { ConfigurationOverview } from './overview';
import { ConfigurationImport } from './import/import';
import { ConfigurationExport } from './export/export';
import { ConfigurationDefinitions } from './definitions/definitions';
import { ConfigurationRevisions } from './revisions/revisions';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import AsideLinks from '@components/AsideLinks';

export const Configuration: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  useEffect(() => {
    if (activeIndex !== null) {
      setActiveIndex(null);
    }
  }, [activeIndex]);
  function getDocsLink() {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Configuration service`;
  }
  function getsupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/configuration-service';
  }
  return (
    <Page>
      <Main>
        <h1 data-testid="configuration-title">Configuration service</h1>
        <Tabs activeIndex={activeIndex} data-testid="configuration-tabs">
          <Tab label="Overview" data-testid="configuration-overview-tab">
            <ConfigurationOverview setActiveEdit={activateEdit} setActiveIndex={setActiveIndex} />
          </Tab>
          <Tab label="Definitions" data-testid="configuration-definitions-tab">
            <ConfigurationDefinitions activeEdit={activateEditState} />
          </Tab>
          <Tab label="Revisions" data-testid="configuration-revisions-tab">
            <ConfigurationRevisions />
          </Tab>
          <Tab label="Import" data-testid="configuration-import-tab">
            <ConfigurationImport />
          </Tab>
          <Tab label="Export" data-testid="configuration-export-tab">
            <ConfigurationExport />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <AsideLinks serviceLink={getsupportcodeLink()} docsLink={getDocsLink()} />
      </Aside>
    </Page>
  );
};
