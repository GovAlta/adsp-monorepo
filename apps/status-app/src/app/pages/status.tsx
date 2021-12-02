import React, { useState, useEffect, FormEvent } from 'react';
import { GoAHeader, GoACallout } from '@abgov/react-components';

import '@abgov/core-css/goa-core.css';
import '@abgov/core-css/goa-components.css';
import '@abgov/core-css/src/lib/stories/page-template/page-template.story.scss';
import { Grid, GridItem } from '@components/Grid';
import ServiceStatus from './statusCard';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { fetchApplications, subscribeToTenant, subscribeToTenantSuccess } from '@store/status/actions';
import { clearNotification } from '@store/session/actions';
import { toTenantName } from '@store/status/models';
import { RootState } from '@store/index';
import { PageLoader } from '@components/PageLoader';
import { LocalTime } from '@components/Date';
import { GoAPageLoader } from '@abgov/react-components';
import moment from 'moment';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAInput, GoAFormActions } from '@abgov/react-components/experimental';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const ServiceStatusPage = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const { config } = useSelector((state: RootState) => ({
    config: state.config,
  }));
  const location = useLocation();
  const realm = location.pathname.slice(1) || config.platformTenantRealm;
  const dispatch = useDispatch();

  const { tenantName, loaded, subscriber, applications, error } = useSelector((state: RootState) => ({
    tenantName: state.session?.tenant?.name,
    loaded: state.session?.isLoadingReady,
    subscriber: state.subscription.subscriber,
    applications: state.application?.applications,
    error: state.session?.notifications,
  }));

  const { allApplicationsNotices } = useSelector((state: RootState) => ({
    allApplicationsNotices: state.notice?.allApplicationsNotices,
  }));

  useEffect(() => {
    dispatch(fetchApplications(realm));
  }, [realm]);

  useEffect(() => {
    if (error && error.length > 0) {
      dispatch(subscribeToTenantSuccess(null));
    }
  }, [error[error?.length - 1]]);

  const timeZone = new Date().toString().split('(')[1].split(')')[0];

  const services = () => {
    return (
      <div className="small-container">
        <PageLoader />
        <h2 data-testid="service-name">All {capitalizeFirstLetter(tenantName)} services</h2>
        <br />
        <p>
          These are the services currently being offered by{' '}
          {location.pathname.slice(1) ? capitalizeFirstLetter(tenantName) : 'the Alberta Digital Service Platform'}. All
          statuses are in real time and reflect current states of the individual services. Please{' '}
          <a href="mailto: DIO@gov.ab.ca">contact support</a> for additional information or any other inquiries
          regarding service statuses.
        </p>
        <div className="timezone">
          <i>All times are in {timeZone}</i>
        </div>
        <br />
        {allApplicationsNotices.length > 0 && <AllApplicationsNotices />}
        <br />
        {applications?.length === 0 && <div>There are no services available by this provider</div>}
        <Grid>
          {applications.map((app, index) => {
            return (
              <GridItem key={index} md={12} vSpacing={1} hSpacing={0.5}>
                <ServiceStatus
                  data-testid={`service-${app.name}`}
                  name={app.name}
                  state={app.status}
                  date={app.lastUpdated ? moment(app.lastUpdated).calendar() : 'Never Ran Yet'}
                  description={app.description}
                  notices={app.notices}
                />
              </GridItem>
            );
          })}
        </Grid>
      </div>
    );
  };

  const noProvider = () => {
    return (
      <div className="small-container">
        <h2>Provider not found</h2>
        <p>Cannot find a provider at this url</p>
      </div>
    );
  };

  const SectionView = () => {
    if (!applications) {
      if (loaded) {
        return noProvider();
      }
      return <GoAPageLoader visible={true} message="Loading..." type="infinite" pagelock={false} />;
    } else {
      return services();
    }
  };

  function emailErrors() {
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return { email: 'You must enter a valid email' };
    }
  }

  function formErrorsFunc() {
    const validEmailSelectedConst = emailErrors();

    return { ...validEmailSelectedConst };
  }

  const save = (e: FormEvent) => {
    e.preventDefault();
    const formErrorList = formErrorsFunc();
    if (Object.keys(formErrorList).length === 0) {
      dispatch(clearNotification());
      const payload = { tenant: toTenantName(realm), email: email };
      dispatch(subscribeToTenant(payload));
      setFormErrors(formErrorList);
    } else {
      setFormErrors(formErrorList);
    }
  };

  const setValue = (name: string, value: string) => {
    setEmail(value);
  };

  const AllApplicationsNotices = () => {
    return (
      <AllApplications>
        <label>
          <b>All services notice</b>
        </label>
        {allApplicationsNotices.map((notice) => {
          return (
            <div data-testid="all-application-notice">
              <GoACallout title="Notice" type="important" key={`{notice-${notice.id}}`}>
                <div data-testid="all-application-notice-message">{notice.message}</div>
                <br />
                <div data-testid="service-notice-date-range">
                  From <LocalTime date={notice.startDate} /> to <LocalTime date={notice.endDate} />
                </div>
              </GoACallout>
            </div>
          );
        })}
      </AllApplications>
    );
  };

  return (
    <div>
      <GoAHeader
        serviceLevel="beta"
        serviceName="Alberta Digital Service Platform -Status & Outages "
        serviceHome="/"
      />
      {/* TODO: re-visit this part when design and card or breadcrumb is ready.
      <div className="goa-banner">
        <div className="small-font">Alberta Digital Service Platform &rarr; Status & Outages</div>
        <hr />
        <h1>Status & Outages</h1>
        <div className="descriptor">Real time monitoring of our applications and services</div>
      </div> */}
      <main>
        <ServiceStatusesCss>
          <section>
            <SectionView />
          </section>
          <br />
          {applications && (
            <div className="small-container">
              <div>
                <h1>Sign up for notifications</h1>
                <div>
                  Sign up to receive notifications by email for current states of the individual services. Please
                  contact <a href="mailto: DIO@gov.ab.ca">DIO@gov.ab.ca</a> for additional information or any other
                  inquiries regarding service statuses.
                </div>
                {subscriber ? (
                  <GoACallout title="You have signed up for notifications" key={new Date().getTime()} type="success">
                    Thank you for signing up. You will receive notifications regarding service statuses on your
                    registered email.
                  </GoACallout>
                ) : (
                  <div>
                    {error && error.length > 0 && (
                      <GoACallout
                        key={`${new Date().getTime()}-${error.length}`}
                        type="emergency"
                        title="Your signup attempt has failed"
                      >
                        {error[error.length - 1].message}
                      </GoACallout>
                    )}
                    <GoAForm>
                      <ErrorWrapper className={(formErrors?.['email'] || error?.length > 0) && 'error'}>
                        <GoAFormItem>
                          <label>Enter your email to receive updates</label>
                          <GoAInput
                            id="email"
                            type="email"
                            name="email"
                            value={email}
                            data-testid="email"
                            onChange={setValue}
                          />
                        </GoAFormItem>
                        <div className="error-msg">{formErrors?.['email']}</div>
                      </ErrorWrapper>
                    </GoAForm>
                    <GoAFormActions alignment="left">
                      <GoAButton buttonType="primary" data-testid="subscribe" onClick={save}>
                        Submit
                      </GoAButton>
                    </GoAFormActions>
                  </div>
                )}
              </div>
            </div>
          )}
        </ServiceStatusesCss>
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
    </div>
  );
};

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

const ServiceStatusesCss = styled.div`
  .small-container {
    max-width: 700px;
    padding: 20px;
    margin: 0 auto;
  }

  .small-font {
    font-size: 10px;
  }

  .flex {
    flex: 1;
  }

  .timezone {
    text-align: right;
    color: #70757a;
    font-size: 13px;
  }
`;

const AllApplications = styled.div`
  margin-right: 0.5rem;
`;

export const ErrorWrapper = styled.div`
  .error-msg {
    display: none;
  }

  &.error {
    label {
      color: var(--color-red);
    }
    input,
    textarea {
      border-color: var(--color-red);
    }
    .error-msg {
      display: block;
      color: var(--color-red);
    }

    .searchWrapper,
    .react-date-picker__wrapper,
    .react-time-picker__wrapper {
      border-color: var(--color-red);
    }
  }
`;

export default ServiceStatusPage;
