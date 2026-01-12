import React, { useState, useEffect } from 'react';
import { GoAHeader } from '@abgov/react-components-old';
import { IndicatorWithDelay } from '@components/Indicator';

import { Grid, GridItem } from '@core-services/app-common';
import { Footer } from '@core-services/app-common';
import ServiceStatus from './statusCard';
import { useSelector, useDispatch } from 'react-redux';

import {
  fetchApplications,
  subscribeToTenant,
  subscribeToTenantSuccess,
  FetchContactInfoService,
} from '@store/status/actions';
import { clearNotification } from '@store/session/actions';
import { toTenantName } from '@store/status/models';
import { RootState } from '@store/index';

import { LocalTime } from '@components/Date';
import moment from 'moment';
import GoaLogo from '../../assets/goa-logo.svg';
import { GoabButton, GoabInput, GoabCallout, GoabFormItem, GoabSkeleton } from '@abgov/react-components';
import { emailError } from '@lib/inputValidation';
import {
  Title,
  Main,
  ServiceStatusesCss,
  GoAFormActionOverwrite,
  AllApplications,
  SkeletonLoading,
  HeaderContainer,
} from './styled-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const ServiceStatusPage = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const { config } = useSelector((state: RootState) => ({
    config: state.config,
  }));

  const realm = window.location.pathname.slice(1) || config.platformTenantRealm;
  const dispatch = useDispatch();

  const { tenantName, loaded, subscriber, applications, error, contact, indicator } = useSelector(
    (state: RootState) => ({
      tenantName: state.session?.tenant?.name,
      loaded: state.session?.isLoadingReady,
      subscriber: state.subscription.subscriber,
      applications: state.application?.applications,
      error: state.session?.notifications,
      contact: state.configuration.contact,
      indicator: state.session.indicator,
    })
  );

  const contactEmail = contact?.contactEmail || 'adsp@gov.ab.ca';

  const { allApplicationsNotices } = useSelector((state: RootState) => ({
    allApplicationsNotices: state.notice?.allApplicationsNotices,
  }));
  const noMonitorOnlyApplications = applications?.filter((application) => !application.monitorOnly);

  useEffect(() => {
    dispatch(fetchApplications(realm));
  }, [realm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(FetchContactInfoService(realm));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error && error.length > 0) {
      dispatch(subscribeToTenantSuccess(null));
    }
  }, [error[error?.length - 1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeZone = new Date().toString().split('(')[1].split(')')[0];

  const Services = () => {
    return (
      <div className="small-container">
        {applications ? (
          <div>
            <Title data-testid="service-name">All {capitalizeFirstLetter(tenantName)} services</Title>
            <div className="section-vs">
              These are the services currently being offered by{' '}
              {window.location.pathname.slice(1)
                ? capitalizeFirstLetter(tenantName)
                : 'the Alberta Digital Service Platform'}
              . All statuses are in real time and reflect current states of the individual services. Please{' '}
              <a href={`mailto: ${contactEmail}`}>contact support</a> for additional information, or to report issues,
              or for any other inquiries regarding service statuses.
            </div>
          </div>
        ) : (
          <PlatformLoading />
        )}

        <div className="section-vs-small">
          {!applications && <AllServiceLoadings />}
          {allApplicationsNotices && allApplicationsNotices.length > 0 && <AllApplicationsNotices />}
          {applications?.length === 0 && <div>There are no services available by this provider</div>}
        </div>

        <div className="title-line">
          <Grid>
            <GridItem md={7}>
              <h3>Service specific statuses and notices</h3>
            </GridItem>
            <div className="line-vs" />
            {noMonitorOnlyApplications?.length > 0 && (
              <GridItem md={5}>
                {allApplicationsNotices?.length === 0 && (
                  <div className="timezone-text">All times are in {timeZone}</div>
                )}
              </GridItem>
            )}
          </Grid>
        </div>
        {!applications && <GoabSkeleton type="card" lineCount={15} />}
        <Grid>
          {noMonitorOnlyApplications &&
            noMonitorOnlyApplications.map((app, index) => {
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
    }
    return Services();
  };
  const PlatformLoading = () => {
    return (
      <SkeletonLoading>
        <GoabSkeleton type="header" size={'4'} />
        <GoabSkeleton type="paragraph" />
        <GoabSkeleton type="text" />
        <GoabSkeleton type="text-small" />
        <br />
      </SkeletonLoading>
    );
  };

  const AllServiceLoadings = () => {
    return (
      <div>
        <AllService />
        <GoabSkeleton type="card" lineCount={0} />
      </div>
    );
  };
  function formErrorsFunc() {
    const validEmailSelectedConst = emailError(email);

    return { ...validEmailSelectedConst };
  }

  const onSave = () => {
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

  const AllService = () => {
    return (
      <AllApplications>
        <div className="title-line">
          <Grid>
            <GridItem md={6}>
              <h3>General notice</h3>
            </GridItem>
            <GridItem md={6}>
              <div className="timezone-text">All times are in {timeZone}</div>
            </GridItem>
          </Grid>
        </div>
      </AllApplications>
    );
  };
  const AllApplicationsNotices = () => {
    return (
      <>
        <AllService />
        <AllApplications>
          {allApplicationsNotices.map((notice) => {
            if (!applications) return <GoabSkeleton type="card" lineCount={60} maxWidth="800px" />;
            else {
              return (
                <GoabCallout heading="Notice" type="important" key={`{notice-${notice.id}}`}>
                  <div data-testid="all-application-notice-message">{notice.message}</div>
                  <br />
                  <div data-testid="service-notice-date-range">
                    From <LocalTime date={notice.startDate} /> to <LocalTime date={notice.endDate} />
                  </div>
                </GoabCallout>
              );
            }
          })}
        </AllApplications>
      </>
    );
  };

  const emailIndex = subscriber?.channels?.findIndex((channel) => channel.channel === 'email');

  return (
    <div>
      <HeaderContainer>
        <GoAHeader
          serviceLevel="live"
          serviceName="Alberta Digital Service Platform - Status & Outages "
          serviceHome="/"
        />
      </HeaderContainer>
      {/* TODO: re-visit this part when design and card or breadcrumb is ready.
      <div className="goa-banner">
        <div className="small-font">Alberta Digital Service Platform &rarr; Status & Outages</div>
        <hr />
        <h1>Status & Outages</h1>
        <div className="descriptor">Real time monitoring of our applications and services</div>
      </div> */}
      <Main>
        <ServiceStatusesCss>
          <section>
            <SectionView />
          </section>
          <div className="line-vs-small" />

          <div className="small-container">
            <div>
              <h3>Sign up for notifications</h3>
              <div>
                Sign up to receive notifications by email for status change of the individual services and notices.
                Please contact <a href={`mailto: ${contactEmail}`}>{contactEmail}</a> for additional information, or to
                report issues, or for any other inquiries regarding service statuses.
              </div>
              <br />
              <div>
                {!applications ? (
                  <GoabSkeleton type="paragraph" />
                ) : (
                  <>
                    <Grid>
                      <GridItem md={4.6}>
                        <GoabFormItem
                          error={formErrors?.['email'] || error?.length > 0 ? formErrors?.['email'] : ''}
                          label="Enter your email to receive updates"
                        >
                          <GoabInput
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            testId="email"
                            onChange={(detail: GoabInputOnChangeDetail) => setValue(detail.name, detail.value)}
                            aria-label="email"
                            width="100%"
                          />
                        </GoabFormItem>
                      </GridItem>
                    </Grid>
                    <GoAFormActionOverwrite>
                      <GoabButton type="primary" testId="subscribe" onClick={onSave}>
                        Submit
                      </GoabButton>
                    </GoAFormActionOverwrite>
                  </>
                )}
              </div>
              {subscriber && indicator && !indicator.show && (
                <GoabCallout key="success" type="success" heading="You have signed up for notifications">
                  Thank you for signing up. You will receive notifications regarding service statuses on{' '}
                  {subscriber.channels[emailIndex].address}.
                </GoabCallout>
              )}
              {error && error.length > 0 && indicator && !indicator.show && (
                <GoabCallout key="error" type="emergency" heading="Your sign up attempt has failed">
                  <p> {error[error.length - 1].message}</p>
                </GoabCallout>
              )}
              {indicator && indicator.show && <IndicatorWithDelay message="Loading..." pageLock={false} />}
            </div>
          </div>
        </ServiceStatusesCss>
      </Main>
      <Footer logoSrc={GoaLogo} />
    </div>
  );
};

export default ServiceStatusPage;
