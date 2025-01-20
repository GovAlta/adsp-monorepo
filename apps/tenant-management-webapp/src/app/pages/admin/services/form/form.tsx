import React, { FunctionComponent, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
import { useLocation } from 'react-router-dom';
import { FormExport } from './export/formExport';
const HelpLink = (): JSX.Element => {
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
  const location = useLocation();
  const isNavigatedFromEdit = location.state?.isNavigatedFromEdit;
  const [isNavigatedFromEditor, setIsNavigatedFromEditor] = useState(isNavigatedFromEdit);

  useEffect(() => {
    if (isNavigatedFromEditor) {
      setActiveIndex(1);
      setActivateEditState(true);
    }
  }, [isNavigatedFromEditor]);

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
                setActiveIndex={setActiveIndex}
              />
            </Tab>
            <Tab label="Definitions" data-testid="form-templates">
              <FormDefinitions
                setOpenAddDefinition={setOpenAddDefinition}
                showFormDefinitions={true}
                openAddDefinition={openAddDefinition}
              />
            </Tab>
            <Tab label="Export" data-testid="form-export">
              <FormExport />
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
