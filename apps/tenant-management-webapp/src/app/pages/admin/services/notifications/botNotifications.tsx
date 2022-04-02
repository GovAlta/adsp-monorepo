import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

interface BotNotificationsProps {
  className?: string;
}

export const BotNotificationsComponent: FunctionComponent<BotNotificationsProps> = ({ className }) => {
  return (
    <section className={className}>
      <h2>Bot notifications</h2>
      <p>
        Notification service can send Slack or Teams messages using a Bot. Invite the ADSP Notification bot into your
        channel then message it for the subscriber address to use.
      </p>
      <p>
        For Slack channels the format is: <span>{'slack/<Team ID>/<Channel ID>'}</span>
      </p>
      <p>
        For Teams the format is: <span>{'msteams/<Channel ID>'}</span>
      </p>
    </section>
  );
};

export const BotNotifications = styled(BotNotificationsComponent)`
  & span {
    font-size: var(--fs-sm);
    background-color: var(--color-gray-100);
    border: 1px solid var(--color-gray-300);
    border-radius: 1px;
    padding: 0.25rem;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
    line-height: normal;
  }
`;
