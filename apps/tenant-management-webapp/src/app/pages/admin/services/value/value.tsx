import React, { FunctionComponent, useEffect, useState } from 'react';
import { Page, Main, Aside } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { ValueOverview } from './valueOverview';
import { ValueDefinitions } from './definitions';
import AsideLinks from '@components/AsideLinks';

export const Value: FunctionComponent = () => {
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
        <h1 data-testid="value-title">Value service</h1>
        <Tabs activeIndex={activeIndex}>
          <Tab label="Overview" data-testid="value-service-overview-tab">
            <ValueOverview setActiveEdit={activateEdit} setActiveIndex={setActiveIndex} />
          </Tab>
          <Tab label="Definitions" data-testid="value-service-definitions-tab">
            <ValueDefinitions activeEdit={activateEditState} />
          </Tab>
        </Tabs>
      </Main>

      <Aside>
        <AsideLinks serviceName="value" />
      </Aside>
    </Page>
  );
};
