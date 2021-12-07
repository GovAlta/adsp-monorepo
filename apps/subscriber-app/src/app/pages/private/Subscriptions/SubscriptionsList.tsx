import { GoAButton } from '@abgov/react-components';
import { GoAIcon } from '@abgov/react-components/experimental';
import React from 'react';
import styled from 'styled-components';

interface SubscriptionsListProps {
  subscriptionTypes: any;
}
const SubscriptionsList = (props: SubscriptionsListProps): JSX.Element => {
  return (
    <>
      {props.subscriptionTypes.map((sub: any) => {
        return (
          <tr key={`${sub.id}`}>
            <td>{sub.name}</td>
            <IconsCell>
              <GoAIcon size="medium" type="mail" />
              <GoAIcon size="medium" type="chatbox-ellipses" />
            </IconsCell>
            <ButtonsCell>
              <GoAButton
                buttonSize="small"
                buttonType="primary"
                key={`${sub.id}`}
                onClick={() => {
                  console.log(sub.name);
                }}
                data-testid={`${sub.id}-subscribe`}
              >
                Subscribe
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
