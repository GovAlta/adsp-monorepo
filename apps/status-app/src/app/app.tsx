import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserState } from 'redux-oidc';
import { GoAHeader } from '@abgov/react-components';

import '@abgov/core-css/goa-core.css';
import '@abgov/core-css/goa-components.css';
import '@abgov/core-css/src/lib/stories/page-template/page-template.story.scss';
import { Grid, GridItem } from '@components/Grid';
import ServiceStatus from './components/ServiceStatus';

import styled from 'styled-components';

import {
  fetchPrivateResource,
  fetchPublicResource,
  publicResourceSelector,
  privateResourceSelector,
} from './start.slice';

export function App() {
  const user = useSelector((state: { user: UserState }) => state.user.user);
  const publicResource = useSelector(publicResourceSelector);
  const privateResource = useSelector(privateResourceSelector);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchPublicResource());
    if (user?.access_token) {
      dispatch(fetchPrivateResource(user?.access_token));
    }
  }, [user, dispatch]);

  return (
    <AppCss>
      <GoAHeader serviceLevel="beta" serviceName="Alberta Digital Service Platform" serviceHome="/" />
      <div className="goa-banner">
        <div className="small-font">Alberta Digital Service Platform &rarr; Status & Outages</div>
        <hr />
        <h1>Status & Outages</h1>
        <div className="descriptor">Real time monitoring of our applications and services</div>
      </div>
      <main>
        <section>
          <div className="small-container">
            <h2>All platform services</h2>
            <p>
              These are the services currently being offered by the Alberta Digital Service Platform. All statuses are
              in real time and reflect current states of the individual services. Please{' '}
              <a href="mailto: DIO@gov.ab.ca">contact support</a> for additional information or any other inquiries
              regarding service statuses.
            </p>
            <br />
            <div className="align-right">
              <i className="time-updated">Updated at: 8:03AM</i>
            </div>
            <Grid>
              <GridItem md={12} vSpacing={1} hSpacing={0.5}>
                <ServiceStatus
                  name="Access Service"
                  state="Outage"
                  date="Today at 5:36AM"
                  assignmentStatus="Assigned"
                  description="Description - Duis aute irure dolor in rerehenderit"
                />
              </GridItem>

              <GridItem md={12} vSpacing={1} hSpacing={0.5}>
                <ServiceStatus
                  name="File Service"
                  state="Reported Issue"
                  date="Today at 5:36AM"
                  assignmentStatus="Awaiting Assignment"
                  description="Description - Duis aute irure dolor in rerehenderit in velutate veleit velit eu"
                />
              </GridItem>
              <GridItem md={12} vSpacing={1} hSpacing={0.5}>
                <ServiceStatus
                  name="Status Service"
                  state="Operational"
                  date="Today at 4:20AM"
                  description="Description - Duis aute irure dolor in rerehenderit in volupate"
                />
              </GridItem>
              <GridItem md={12} vSpacing={1} hSpacing={0.5}>
                <ServiceStatus
                  name="Test Service"
                  state="Operational"
                  date="Today at 3:15AM"
                  description="Description - Duis aute irure dolor in rerehenderit in voluptate vele"
                />
              </GridItem>
            </Grid>
          </div>
        </section>
      </main>
      <Footer>
        <a href="https://www.alberta.ca">Go to Alberta.ca</a>
        <FooterLinks>
          <a href="https://www.alberta.ca/disclaimer.aspx">Disclaimer</a>
          <a href="https://www.alberta.ca/privacystatement.aspx">Privacy</a>
          <a href="https://www.alberta.ca/accessibility.aspx">Accessibility</a>
        </FooterLinks>
        <FooterCopyright>&#169; 2020 Government of Alberta</FooterCopyright>
      </Footer>
    </AppCss>
  );
}

export default App;

const Footer = styled.div`
  padding-top: 20px;
  text-align: center;
  background-color: #f1f1f1;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  margin: 0 1rem;
  > * {
    display: inline-block;
    margin-right: 1rem;
    &:last-of-type {
      margin-right: 0;
    }
  }
`;

const FooterCopyright = styled.div`
  text-align: center;
  padding: 1rem;
`;

const AppCss = styled.div`
  .main-container {
    position: relative;
  }

  .small-container {
    max-width: 700px;
    padding: 20px;
    margin: 0 auto;
  }

  .small-font {
    font-size: 10px;
  }

  .align-right {
    text-align: right;
  }

  .time-updated {
    font-size: 15px;
    padding-right: 15px;
  }

  .flex {
    flex: 1;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .goa-error {
    padding-left: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M11,9.41v4.52a1,1,0,0,0,2,0V9.41a1,1,0,0,0-2,0Z'/%3E%3Cpath fill='%23fff' d='M12,16.15a1.29,1.29,0,1,0,1.29,1.29A1.29,1.29,0,0,0,12,16.15Z'/%3E%3Cpath fill='%23fff' d='M22.87,20.14l-10-17.32a1,1,0,0,0-1.74,0l-10,17.32a1,1,0,0,0,0,1,1,1,0,0,0,.87.5H22a1,1,0,0,0,.87-.5A1,1,0,0,0,22.87,20.14Zm-19.14-.5L12,5.32l8.27,14.32Z'/%3E%3C/svg%3E");
    background-color: transparent;
    background-repeat: no-repeat;
    background-position: 1px 6px;
    background-size: 16px 16px;
  }

  .goa-warning {
    padding-left: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z'/%3E%3Cpath fill='%23000' d='M12,14.46a1,1,0,0,0,1-1V6.57a1,1,0,0,0-2,0v6.89A1,1,0,0,0,12,14.46Z'/%3E%3Cpath fill='%23000' d='M12,15.68A1.29,1.29,0,1,0,13.29,17,1.29,1.29,0,0,0,12,15.68Z'/%3E%3C/svg%3E");
    background-color: transparent;
    background-repeat: no-repeat;
    background-position: 1px 6px;
    background-size: 16px 16px;
  }
`;
