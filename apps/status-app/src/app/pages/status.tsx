import React, { useState, useEffect, FormEvent } from 'react';
import { GoAHeader, GoACallout } from '@abgov/react-components';

import { Grid, GridItem } from '@components/Grid';
import Footer from '@components/Footer';
import ServiceStatus from './statusCard';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import {
  fetchApplications,
  subscribeToTenant,
  subscribeToTenantSuccess,
  FetchContactInfoService,
} from '@store/status/actions';
import { clearNotification } from '@store/session/actions';
import { toTenantName } from '@store/status/models';
import { RootState } from '@store/index';
import { PageLoader } from '@components/PageLoader';
import { LocalTime } from '@components/Date';
import { GoAPageLoader } from '@abgov/react-components';
import moment from 'moment';
import GoaLogo from '../../assets/goa-logo.svg';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAInputEmail, GoAFormActions } from '@abgov/react-components/experimental';

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

  const { tenantName, loaded, subscriber, applications, error, contact } = useSelector((state: RootState) => ({
    tenantName: state.session?.tenant?.name,
    loaded: state.session?.isLoadingReady,
    subscriber: state.subscription.subscriber,
    applications: state.application?.applications,
    error: state.session?.notifications,
    contact: state.configuration.contact,
  }));

  const contactEmail = contact?.contactEmail || 'adsp@gov.ab.ca';

  const { allApplicationsNotices } = useSelector((state: RootState) => ({
    allApplicationsNotices: state.notice?.allApplicationsNotices,
  }));

  useEffect(() => {
    dispatch(fetchApplications(realm));
  }, [realm]);

  useEffect(() => {
    dispatch(FetchContactInfoService(realm));
  }, []);

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
        <Title data-testid="service-name">All {capitalizeFirstLetter(tenantName)} services</Title>
        <br />
        <p>
          These are the services currently being offered by{' '}
          {location.pathname.slice(1) ? capitalizeFirstLetter(tenantName) : 'the Alberta Digital Service Platform'}. All
          statuses are in real time and reflect current states of the individual services. Please{' '}
          <a href={`mailto: ${contactEmail}`}>contact support</a> for additional information, or to report issues, or
          for any other inquiries regarding service statuses.
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
        <Title>Provider not found</Title>
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
      const payload = { tenant: toTenantName(realm), email: email, type: 'status-application-status-change' };
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

  const emailIndex = subscriber?.channels?.findIndex((channel) => channel.channel === 'email');

  return (
    <div>
      <GoAHeader
        serviceLevel="beta"
        serviceName="Alberta Digital Service Platform - Status & Outages "
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
                <h2>Sign up for notifications</h2>
                <div>
                  Sign up to receive notifications by email for status change of the individual services and notices.
                  Please contact <a href={`mailto: ${contactEmail}`}>{contactEmail}</a> for additional information, or
                  to report issues, or for any other inquiries regarding service statuses.
                </div>
                <div>
                  <GoAForm>
                    <GoAFormItem error={formErrors?.['email'] || error?.length > 0}>
                      <label>Enter your email to receive updates</label>
                      <GoAInputEmail
                        id="email"
                        disabled={subscriber !== null}
                        name="email"
                        value={email}
                        data-testid="email"
                        onChange={setValue}
                        aria-label="email"
                      />
                    </GoAFormItem>
                  </GoAForm>
                  <GoAFormActions alignment="left">
                    <GoAButton
                      disabled={subscriber !== null}
                      buttonType="primary"
                      data-testid="subscribe"
                      onClick={save}
                    >
                      Submit
                    </GoAButton>
                  </GoAFormActions>
                </div>
                {subscriber && (
                  <GoACallout title="You have signed up for notifications" key="success" type="success">
                    Thank you for signing up. You will receive notifications regarding service statuses on{' '}
                    {subscriber.channels[emailIndex].address}.
                  </GoACallout>
                )}
                {error && error.length > 0 && (
                  <GoACallout key="error" type="emergency" title="Your signup attempt has failed">
                    {error[error.length - 1].message}
                  </GoACallout>
                )}
              </div>
            </div>
          )}
        </ServiceStatusesCss>
      </main>
      <Footer logoSrc={GoaLogo} />
    </div>
  );
};

const Title = styled.h1`
  && {
    font-weight: var(--fw-regular);
  }
`;

const ServiceStatusesCss = styled.div`
  .small-container {
    max-width: 43.75rem;
    padding: 1.25rem;
    margin: 0 auto;
    div.goa-form div {
      padding: 0;
      outline: none;
    }
    div.goa-form input {
      border: none;
      margin: 0;
    }
  }

  .small-font {
    font-size: 0.625rem;
  }

  .flex {
    flex: 1;
  }

  .timezone {
    text-align: right;
    color: #70757a;
    font-size: var(-fs-xs);
  }
`;

const AllApplications = styled.div`
  margin-right: 0.5rem;
`;

export default ServiceStatusPage;
