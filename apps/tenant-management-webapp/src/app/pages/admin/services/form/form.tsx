import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormOverview from './formOverview';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { FormDefinitions } from './definitions/definitions';
import { Tab, Tabs } from '@components/Tabs';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import AsideLinks from '@components/AsideLinks';
import { HeadingDiv } from './styled-components';
import BetaBadge from '@icons/beta-badge.svg';
import { FetchRealmRoles } from '@store/tenant/actions';

const HelpLink = (): JSX.Element => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  function getCalenderDocsLink() {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Form service`;
  }
  function getCalendersupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/form-service';
  }
  return <AsideLinks serviceLink={getCalendersupportcodeLink()} docsLink={getCalenderDocsLink()} />;
};

export const Form: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  //const [activeIndex, setActiveIndex] = useState<number>(0);

  const [openAddDefinition, setOpenAddDefinition] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(FetchRealmRoles());

    dispatch(fetchKeycloakServiceRoles());
  }, [dispatch]);

  const searchParams = new URLSearchParams(document.location.search);

  const definitions = tenantName && searchParams.get('definitions');

  return (
    <Page>
      <Main>
        <>
          <HeadingDiv>
            <h1 data-testid="form-title">Form service</h1>
            <img src={BetaBadge} alt="Form Service" />
          </HeadingDiv>
          <Tabs activeIndex={definitions === 'true' ? 1 : 0} data-testid="form-tabs">
            <Tab label="Overview" data-testid="form-overview-tab">
              <FormOverview setOpenAddDefinition={setOpenAddDefinition} />
            </Tab>
            <Tab label="Definitions" data-testid="form-templates">
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
