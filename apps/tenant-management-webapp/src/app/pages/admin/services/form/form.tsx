import React, { FunctionComponent, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { Aside, Main, Page } from '@components/Html';

import AsideLinks from '@components/AsideLinks';
import { HeadingDiv } from './styled-components';
import BetaBadge from '@icons/beta-badge.svg';
import LinkCopyComponent from '@components/CopyLink/CopyLink';
import { selectFormAppHost } from '@store/form/selectors';

import { FormServiceCommon } from '@form-service-common';
const HelpLink = (): JSX.Element => {
  const defaultFormUrl = useSelector((state: RootState) => selectFormAppHost(state));
  return (
    <Aside>
      <div style={{ zIndex: -1, position: 'relative' }}>
        <AsideLinks serviceName="form" />
        <h3>Submit applications</h3>
        <span>Users can access forms and submit applications here:</span>
        <h3>Form app link</h3>
        <LinkCopyComponent text={'Copy link'} link={defaultFormUrl} />
      </div>
    </Aside>
  );
};

export const Form: FunctionComponent = () => {
  const session = useSelector((state: RootState) => state.session);

  return (
    <Page>
      <Main>
        <>
          <HeadingDiv>
            <h1 data-testid="form-title">Form service</h1>
            <img src={BetaBadge} alt="Form Service" />
          </HeadingDiv>
          <FormServiceCommon
            session={session}
            config={{
              tabs: {
                overview: true,
                definition: {
                  enabled: true,
                  features: {
                    filterByTag: true,
                    filterByProgram: true,
                    filterByMinistry: true,
                    registeredID: true,
                    searchActsOfLegislation: true,
                  },
                },
                export: true,
              },
            }}
          />
        </>
      </Main>
      <Aside>
        <HelpLink />
      </Aside>
    </Page>
  );
};
