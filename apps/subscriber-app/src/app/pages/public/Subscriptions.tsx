import React, { useEffect, useState } from 'react';
import { Main } from '@components/Html';
import { Container, TextGoASkeleton } from '@core-services/app-common';
import DataTable from '@components/DataTable';
import { GoabContainer, GoabButton, GoabCallout, GoabButtonGroup, GoabModal, GoabBadge } from '@abgov/react-components';
import { FetchContactInfoService } from '@store/notification/actions';
import { FetchTenantService } from '@store/tenant/actions';
import { Channels, expireMinutes } from '@store/subscription/models';
import { CheckCode, VerifyEmail } from '@store/subscription/actions';

import styled from 'styled-components';
import {
  Label,
  ContactInformationContainer,
  ContactInformationWrapper,
  CalloutWrapper,
  SubscriptionListContainer,
  DescriptionWrapper,
  VerificationWrapper,
  ButtonMargin,
} from '../private/Subscriptions/styled-components';

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSubscriberDetails, signedOutUnsubscribe } from '@store/subscription/actions';
import { RootState } from '@store/index';
import SubscriptionsList from '@components/SubscriptionsList';
import { SubscriberChannel, Subscription } from '@store/subscription/models';

const Subscriptions = (): JSX.Element => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, _] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const EMAIL = 'email';
  const { subscriber } = useSelector((state: RootState) => ({
    subscriber: state.subscription.subscriber,
  }));

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const code = searchParams.get('code');

  const contact = useSelector((state: RootState) => state.notification?.contactInfo);
  const previouslyVerified = useSelector((state: RootState) => state.subscription.previouslyVerified);

  const subscriberEmail = subscriber?.channels.find((chn: SubscriberChannel) => chn.channel === EMAIL)?.address;
  const [showUnSubscribeModal, setShowUnSubscribeModal] = useState(false);
  const [selectedUnsubscribeSub, setSelectedUnsubscribeSub] = useState<Subscription>();
  const { subscriberId } = useParams();
  const isEmailVerified = subscriber && subscriber?.channels?.find((c) => c.channel === Channels.email)?.verified;

  const phoneWrapper = (phoneNumber) => {
    if (phoneNumber) {
      return (
        '1 (' + phoneNumber.substring(0, 3) + ') ' + phoneNumber.substring(3, 6) + '-' + phoneNumber.substring(6, 10)
      );
    }
  };
  useEffect(() => {
    dispatch(getSubscriberDetails(subscriberId));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const tenantId = subscriber?.tenantId?.split('/').pop();
    if (tenantId) {
      dispatch(FetchContactInfoService({ tenantId: tenantId }));
      dispatch(FetchTenantService({ tenantId: tenantId }));
    }
  }, [subscriber]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (previouslyVerified.email && code !== 'null' && code) {
      navigate(`${window.location.pathname}`);
    }
  }, [previouslyVerified]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (code !== 'null' && subscriber && code) {
      dispatch(CheckCode('email', code, subscriber, true));
    }
  }, [searchParams, subscriber]); // eslint-disable-line react-hooks/exhaustive-deps

  const unSubscribe = (typeId: string) => {
    setShowUnSubscribeModal(true);
    setSelectedUnsubscribeSub(subscriber?.subscriptions.filter((item) => item.typeId === typeId)[0]);
  };
  const resetSelectedUnsubscribe = () => {
    setShowUnSubscribeModal(false);
    setSelectedUnsubscribeSub(undefined);
  };

  const emailChannelIndex = subscriber?.channels?.findIndex((channel) => {
    return channel.channel === Channels?.email;
  });

  const validCodeExists =
    subscriber?.channels[emailChannelIndex]?.pendingVerification &&
    subscriber?.channels[emailChannelIndex]?.timeCodeSent + 1000 * 60 * expireMinutes > Date.now();

  const unSubscribeModal = () => {
    return (
      <GoabModal open={true} key={1} testId="unsubscribe-modal" heading="Are you sure you want unsubscribe?">
        <GoAModelTextWrapper data-testId="unsubscribe-modal-content">
          If you decide to unsubscribe from “{selectedUnsubscribeSub.type.name}” you won’t receive any updates from the
          service in the future.{' '}
        </GoAModelTextWrapper>
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="unsubscribe-modal-cancel-button"
            onClick={() => {
              resetSelectedUnsubscribe();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            testId="unsubscribe-modal-okay-button"
            onClick={() => {
              dispatch(
                signedOutUnsubscribe({
                  type: selectedUnsubscribeSub.typeId,
                  subscriberId: selectedUnsubscribeSub.subscriberId,
                  tenantId: subscriber?.tenantId,
                })
              );
              resetSelectedUnsubscribe();
            }}
          >
            Unsubscribe
          </GoabButton>
        </GoabButtonGroup>
      </GoabModal>
    );
  };

  return (
    <SubscriptionManagement>
      <Main>
        <Container hs={2} vs={4.5} xlHSpacing={12}>
          <h1 data-testid="service-name">Subscription management</h1>
          <DescriptionWrapper>
            <p data-testid="service-description">
              Use this page to manage your subscriptions. Please note that you need to contact support to modify some
              subscriptions. If you have an account, sign in to manage your contact information.
            </p>
          </DescriptionWrapper>
          {showUnSubscribeModal ? unSubscribeModal() : ''}
          <ContactInformationWrapper>
            <GoabContainer
              accent="thick"
              type="interactive"
              title="Contact information"
              data-testid="contact-information-card"
            >
              <div data-testid="email-label">
                <Label>Email</Label>
              </div>
              <ContactInformationContainer>
                <p>
                  <VerificationWrapper>
                    {isEmailVerified !== undefined && isEmailVerified === true && (
                      <GoabBadge type="success" content="Verified" icon={false} />
                    )}
                    {isEmailVerified !== undefined && isEmailVerified === false && (
                      <div>
                        {validCodeExists ? (
                          <div>
                            <GoabBadge type="midtone" content="Pending" icon={false} />
                          </div>
                        ) : (
                          <GoabBadge type="important" content="Not verified" icon={false} />
                        )}
                      </div>
                    )}
                  </VerificationWrapper>

                  {subscriberEmail}
                </p>
              </ContactInformationContainer>
              {!subscriberEmail && (indicator?.show ? <TextGoASkeleton lineCount={1} /> : <>No Email</>)}

              <ButtonMargin>
                <GoabButton
                  size="compact"
                  disabled={validCodeExists || isEmailVerified === undefined || isEmailVerified === true}
                  testId="verify-email"
                  onClick={() => {
                    dispatch(VerifyEmail(subscriber, true));
                  }}
                >
                  Verify email
                </GoabButton>
              </ButtonMargin>
            </GoabContainer>
          </ContactInformationWrapper>

          <>
            <GoabModal></GoabModal>
            <SubscriptionListContainer>
              <DataTable data-testid="subscriptions-table">
                {!subscriber || subscriber?.subscriptions?.length > 0 ? (
                  <tr>
                    <th id="subscriptions">Subscription</th>
                    <th id="descriptions">Description</th>
                    <th id="available-channels">Available channels</th>
                    <th id="action">Action</th>
                  </tr>
                ) : (
                  ''
                )}
                <tbody>
                  {subscriber ? (
                    <SubscriptionsList onUnsubscribe={unSubscribe} subscriber={subscriber} />
                  ) : indicator?.show ? (
                    <tr>
                      <td colSpan={4}>
                        <TextGoASkeleton lineCount={5} />
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={4}>No Subscriptions</td>
                    </tr>
                  )}
                </tbody>
              </DataTable>
              {subscriber?.subscriptions?.length <= 0 ? (
                <GoabCallout heading="You have no subscriptions" type="important"></GoabCallout>
              ) : (
                ''
              )}
            </SubscriptionListContainer>
            {indicator?.show ? (
              <TextGoASkeleton lineCount={5} />
            ) : (
              <CalloutWrapper id="contactSupport">
                <GoabCallout heading="Need help? Contact your service admin" type="information">
                  <div>{contact?.supportInstructions}</div>
                  <div>
                    {contact?.contactEmail && (
                      <>
                        Email:{' '}
                        <a rel="noopener noreferrer" target="_blank" href={`mailto:${contact?.contactEmail}`}>
                          {contact?.contactEmail}
                        </a>
                      </>
                    )}
                  </div>
                  {contact?.phoneNumber && <div>Phone: {phoneWrapper(contact?.phoneNumber)}</div>}
                  <div data-testid="service-notice-date-range"></div>
                </GoabCallout>
              </CalloutWrapper>
            )}
          </>
        </Container>
      </Main>
    </SubscriptionManagement>
  );
};
export default Subscriptions;

const SubscriptionManagement = styled.div`
  tr > th {
    padding-bottom: 0.5rem;
  }
`;

const GoAModelTextWrapper = styled.div`
  padding: 0 1.5rem 0 1.75rem;
  max-width: 36rem;
`;
