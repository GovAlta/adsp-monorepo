import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormOverview from './formOverview';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { FormDefinitions } from './definitions/definitions';
import { FormRefs } from './definitions/refs';
import { Tab, Tabs } from '@components/Tabs';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import AsideLinks from '@components/AsideLinks';
import { HeadingDiv } from './styled-components';
import BetaBadge from '@icons/beta-badge.svg';
import { FetchRealmRoles } from '@store/tenant/actions';
import LinkCopyComponent from '@components/CopyLink/CopyLink';
import { selectFormAppHost } from '@store/form/selectors';
import { fetchDirectory } from '@store/directory/actions';

const HelpLink = (): JSX.Element => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchDirectory());
  }, [dispatch]);
  const defaultFormUrl = useSelector((state: RootState) => selectFormAppHost(state));
  return (
    <Aside>
      <AsideLinks serviceName="form" />
      <h3>Submit applications</h3>
      <span>Users can access forms and submit applications here:</span>
      <h3>Form app link</h3>
      <LinkCopyComponent text={'Copy link'} link={defaultFormUrl} />
    </Aside>
  );
};

export const Form: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);

  const [openAddDefinition, setOpenAddDefinition] = useState(false);

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
            <Tab label="Refs" data-testid="form-refs">
              <FormRefs />
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
