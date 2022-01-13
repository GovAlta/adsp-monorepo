import React, { useState, useEffect, FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { DirectoryOverview } from './overview';
import { GoAPageLoader } from '@abgov/react-components';
import SupportLinks from '@components/SupportLinks';

export const Directory: FunctionComponent = () => {
  const dispatch = useDispatch();
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, [dispatch]);
  return (
    <Page>
      <Main>
        {isLoaded ? (
          <>
            <h1>Directory services</h1>
            <Tabs activeIndex={0}>
              <Tab label="Overview">
                <DirectoryOverview />
              </Tab>
            </Tabs>
          </>
        ) : (
          <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />
        )}
      </Main>
      <Aside>
        <h3>Helpful links</h3>
        <SupportLinks />
      </Aside>
    </Page>
  );
};
