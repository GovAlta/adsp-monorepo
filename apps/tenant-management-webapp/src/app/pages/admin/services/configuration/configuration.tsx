import React, { FunctionComponent, useEffect, useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { ConfigurationOverview } from './overview';
import { ConfigurationImport } from './import/import';
import { ConfigurationExport } from './export/export';
import { ConfigurationDefinitions } from './definitions/definitions';
import { ConfigurationRevisions } from './revisions/revisions';
import AsideLinks from '@components/AsideLinks';

export const Configuration: FunctionComponent = () => {
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
        <AsideLinks serviceName="configuration" />
      </Aside>
    </Page>
  );
};
