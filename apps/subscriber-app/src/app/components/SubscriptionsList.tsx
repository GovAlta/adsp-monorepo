import { GoAButton } from '@abgov/react-components';
import { Subscription, Subscriber, Channel, Channels } from '@store/subscription/models';
import React from 'react';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { ReactComponent as Mail } from '@assets/icons/mail.svg';
import { ReactComponent as Slack } from '@assets/icons/slack.svg';
import { ReactComponent as Chat } from '@assets/icons/chat.svg';

interface SubscriptionsListProps {
  subscriber: Subscriber;
  onUnsubscribe: (typeId: string) => void;
}

const ChannelIcons = {
  email: <Mail data-testid="mail-icon" style={{ color: '#666666' }} />,
  sms: <Chat data-testid="sms-icon" style={{ color: '#666666' }} />,
  bot: <Slack data-testid="bot-icon" style={{ color: '#666666' }} />,
};

const AvailableChannelsContainer = styled.div`
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  .icon-0 {
    display: inline-flex;
    padding-right: 1rem;
    padding-left: 1.5rem;
  }
  .icon-1 {
    display: inline-flex;
  }
  .icon-2 {
    display: inline-flex;
    padding-right: 1.5rem;
    padding-left: 1rem;
  }
`;

interface AvailableChannelsProps {
  subscriberChannels: Channel[];
  typeChannels: Channel[];
}

const AvailableChannels = ({ subscriberChannels, typeChannels }: AvailableChannelsProps): JSX.Element => {
  const channels = subscriberChannels.filter((chn) => {
    return typeChannels.includes(chn);
  });

  const bot = Channels.bot as Channel;

  if (!subscriberChannels.includes(bot) && typeChannels.includes(bot)) {
    channels.push(bot);
  }

  if (channels) {
    return (
      <AvailableChannelsContainer>
        {channels.map((chn, index) => {
          return <div className={`icon-${index}`}>{ChannelIcons[chn]}</div>;
        })}
      </AvailableChannelsContainer>
    );
  }

  return <div />;
};

const SubscriptionsList = (props: SubscriptionsListProps): JSX.Element => {
  const subscriptions = props.subscriber.subscriptions;
  const subscriberChannels = props.subscriber.channels
    .filter((chn) => {
      return chn?.address;
    })
    .map((chn) => {
      return chn.channel;
    }) as Channel[];

  return (
    <>
      {subscriptions.map((subscription: Subscription) => {
        const typeChannels = subscription.type.channels;
        return (
          <tr key={`${subscription.typeId}`}>
            <td data-testid="subscription-name">{subscription.type.name}</td>
            <td>
              <AvailableChannels subscriberChannels={subscriberChannels} typeChannels={typeChannels} />
            </td>
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
