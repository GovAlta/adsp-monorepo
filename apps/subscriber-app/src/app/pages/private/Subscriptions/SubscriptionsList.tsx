import { GoAButton } from '@abgov/react-components';
import { GoAIcon } from '@abgov/react-components/experimental';
import { Subscription } from '@store/subscription/models';
import React from 'react';
import styled from 'styled-components';

interface SubscriptionsListProps {
  subscriptions: Subscription[];
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
              <GoAButton
                buttonSize="small"
                buttonType="tertiary"
                key={`${subscription.typeId}`}
                onClick={() => {
                  console.log(subscription.typeId);
                }}
                data-testid="unsubscribe-button"
              >
                Unsubscribe
              </GoAButton>
            </ButtonsCell>
          </tr>
        );
      })}
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
`;
