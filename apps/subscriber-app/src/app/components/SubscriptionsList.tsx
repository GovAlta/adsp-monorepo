import { GoAButton } from '@abgov/react-components';
import { Subscription, Subscriber, Channel, Channels } from '@store/subscription/models';
import React from 'react';
import { RootState } from '@store/index';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { ReactComponent as Mail } from '@assets/icons/mail.svg';
import { ReactComponent as Slack } from '@assets/icons/slack.svg';
import { ReactComponent as Chat } from '@assets/icons/chat.svg';
import { ReactComponent as Checkmark } from '@assets/icons/checkmark.svg';

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
  vertical-align: baseline;
  align-items: center;
  display: flex;
  position: relative;
  .icon-0 {
    position: absolute;
    left: calc(50% - 75px);
    top: -12px;
  }
  .icon-checked-0 {
    position: absolute;
    left: calc(50% - 60px);
    top: -22px;
  }
  .icon-1 {
    position: absolute;
    left: calc(50% - 31px);
    top: -12px;
  }
  .icon-checked-1 {
    position: absolute;
    left: calc(50% - 14px);
    top: -22px;
  }

  .icon-2 {
    position: absolute;
    left: calc(50% + 6px);
    top: -12px;
  }

  .icon-checked-2 {
    position: absolute;
    left: calc(50% + 21px);
    top: -22px;
  }
`;

interface AvailableChannelsProps {
  channels: Channel[];
  effectiveChannel: Channel | undefined;
}

const AvailableChannels = ({ channels, effectiveChannel }: AvailableChannelsProps): JSX.Element => {
  const channelOrder = Object.keys(Channels) as Channel[];

  if (channels) {
    return (
      <AvailableChannelsContainer>
        {channelOrder.map((chn, index) => {
          if (channels.includes(chn)) {
            if (chn === effectiveChannel) {
              return (
                <div>
                  <div className={`icon-${index}`}>{ChannelIcons[chn]}</div>
                  <div className={`icon-checked-${index}`}>
                    <Checkmark />
                  </div>
                </div>
              );
            }
            return <div className={`icon-${index}`}>{ChannelIcons[chn]}</div>;
          } else {
            return <div />;
          }
        })}
      </AvailableChannelsContainer>
    );
  }

  return <div />;
};

const SubscriptionsList = (props: SubscriptionsListProps): JSX.Element => {
  const subscriptions = props.subscriber.subscriptions;
  const effectiveChannel = props.subscriber?.channels[0];

  return (
    <>
      {subscriptions.map((subscription: Subscription) => {
        const typeChannels = subscription.type.channels;
        return (
          <tr key={`${subscription.typeId}`}>
            <td data-testid="subscription-name">{subscription.type.name}</td>
            <td>{subscription.type.description}</td>
            <td>
              <AvailableChannels channels={typeChannels} effectiveChannel={effectiveChannel?.channel as Channel} />
            </td>
            <td>
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
            </td>
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
