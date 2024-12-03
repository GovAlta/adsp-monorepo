import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FormOverview from './formOverview';
import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';
import { FormDefinitions } from './definitions/definitions';
import { Tab, Tabs } from '@components/Tabs';
import AsideLinks from '@components/AsideLinks';
import { HeadingDiv } from './styled-components';
import BetaBadge from '@icons/beta-badge.svg';
import LinkCopyComponent from '@components/CopyLink/CopyLink';
import { selectFormAppHost } from '@store/form/selectors';
import { fetchDirectory } from '@store/directory/actions';
import { getFormDefinitions } from '@store/form/action';
import { useLocation } from 'react-router-dom';

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
  const [openAddDefinition, setOpenAddDefinition] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);

  const dispatch = useDispatch();
  const formDefinitions = useSelector((state: RootState) => state.form?.definitions);
  const location = useLocation();

  const searchParams = new URLSearchParams(document.location.search);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const definitions = tenantName && searchParams.get('definitions');
  const isNavigatedFromEdit = location.state?.isNavigatedFromEdit;
  const [isNavigatedFromEditor, setIsNavigatedFromEditor] = useState(isNavigatedFromEdit);
  useEffect(() => {
    if (formDefinitions && Object.keys(formDefinitions).length === 0) {
      dispatch(getFormDefinitions());
    }

    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNavigatedFromEditor) {
      activateEdit(true);
    }
  }, [isNavigatedFromEditor]);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  return (
    <Page>
      <Main>
        <>
          <HeadingDiv>
            <h1 data-testid="form-title">Form service</h1>
            <img src={BetaBadge} alt="Form Service" />
          </HeadingDiv>
          <Tabs activeIndex={activeIndex} data-testid="form-tabs">
            <Tab label="Overview" data-testid="form-overview-tab">
              <FormOverview
                openAddDefinition={openAddDefinition}
                activateEdit={activateEditState}
                setOpenAddDefinition={setOpenAddDefinition}
                setActiveEdit={activateEdit}
                setActiveIndex={setActiveIndex}
              />
            </Tab>
            <Tab label="Definitions" data-testid="form-templates">
              <FormDefinitions
                setOpenAddDefinition={setOpenAddDefinition}
                showFormDefinitions={true}
                openAddDefinition={openAddDefinition}
                setActiveEdit={activateEdit}
                setActiveIndex={setActiveIndex}
              />
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
