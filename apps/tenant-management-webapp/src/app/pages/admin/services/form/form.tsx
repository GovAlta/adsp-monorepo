import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormOverview from './formOverview';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { FormDefinitions } from './definitions/definitions';
import { Tab, Tabs } from '@components/Tabs';
import SupportLinks from '@components/SupportLinks';
import { fetchKeycloakServiceRoles } from '@store/access/actions';

const HelpLink = (): JSX.Element => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  function getCalenderDocsLink() {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Form service`;
  }
  function getCalendersupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/form-service';
  }
  return (
    <>
      <h3>Helpful links</h3>
      <a
        rel="noopener noreferrer"
        target="_blank"
        href={`${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=File service`}
      >
        Read the API docs
      </a>
      <br />
      <a
        rel="noopener noreferrer"
        target="_blank"
        href="https://github.com/GovAlta/adsp-monorepo/tree/main/apps/file-service"
      >
        See the code
      </a>
      <SupportLinks />
    </>
  );
};

export const Form: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchKeycloakServiceRoles());
  }, []);

  const [openAddDefinition, setOpenAddDefinition] = useState(false);

  const searchParams = new URLSearchParams(document.location.search);

  const definitions = tenantName && searchParams.get('definitions');

  return (
    <Page>
      <Main>
        <>
          <h1 data-testid="form-title">Form service</h1>
          <Tabs activeIndex={definitions === 'true' ? 1 : 0}>
            <Tab label="Overview">
              <FormOverview setActiveIndex={setActiveIndex} setOpenAddDefinition={setOpenAddDefinition} />
            </Tab>
            <Tab label="Templates">
              <FormDefinitions openAddDefinition={openAddDefinition} />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <HelpLink />
      </Aside>
    </Page>
  );
};
