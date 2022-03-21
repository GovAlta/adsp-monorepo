import { GoAButton } from '@abgov/react-components';
import { GoAIcon } from '@abgov/react-components/experimental';
import { Subscription } from '@store/subscription/models';
import React from 'react';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  onUnsubscribe: (typeId: string) => void;
}

const SubscriptionsList = (props: SubscriptionsListProps): JSX.Element => {
  return (
    <>
      {props.subscriptions.map((subscription: Subscription) => {
        return (
          <tr key={`${subscription.typeId}`}>
            <td data-testid="subscription-name">{subscription.type.name}</td>
            <IconsCell>
              <GoAIcon data-testid="mail-icon" size="medium" type="mail" />
            </IconsCell>
            <ButtonsCell>
              {subscription.type?.manageSubscribe ? (
                <GoAButton
                  buttonSize="small"
                  buttonType="tertiary"
                  key={`${subscription.typeId}`}
                  onClick={() => {
                    props.onUnsubscribe(subscription.typeId);
                  }}
                  data-testid="unsubscribe-button"
                >
                  Unsubscribe
                </GoAButton>
              ) : (
                <UnsubscribeMessage />
              )}
            </ButtonsCell>
          </tr>
        );
      })}
    </>
  );
};

const UnsubscribeMessage = (): JSX.Element => {
  const contact = useSelector((state: RootState) => state.notification?.contactInfo);
  return (
    <>
      {contact?.contactEmail ? (
        <a href={`${window.location.pathname}#contactSupport`}>Contact support to unsubscribe</a>
      ) : (
        'Contact support to unsubscribe'
      )}
    </>
  );
};

export default SubscriptionsList;

const ButtonsCell = styled.td`
  text-align: right;
`;

const IconsCell = styled.td`
  display: flex;
  justify-content: space-around;
  width: 50%;
  margin-top: 0.4rem;
`;
