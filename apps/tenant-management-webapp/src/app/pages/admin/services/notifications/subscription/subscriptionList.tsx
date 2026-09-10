import React, { FunctionComponent, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { Subscriber, Subscription, SubscriptionSearchCriteria, Criteria } from '@store/subscription/models';
import { UpdateSubscriber, GetTypeSubscriptions } from '@store/subscription/actions';
import styled from 'styled-components';
import { SubscriberModalForm } from '../subscribers/editSubscriber';
import { GoabIcon } from '@abgov/react-components';
import { SubscriptionNextLoader } from './subscriptionNextLoader';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { phoneWrapper } from '@lib/wrappers';
import { PageIndicator } from '@components/Indicator';
import { EntryDetail } from '../../styled-components';
import { renderNoItem } from '@components/NoItem';
interface SubscriptionProps {
  subscriber: Subscriber;
  criteria: Criteria;
  typeId: string;
  readonly?: boolean;
  groupIndex: number;
  index: number;
  openModal?: (subscription: Subscription) => void;
  onDelete: (subscription: Subscriber, type: string) => void;
}

const SubscriptionComponent: FunctionComponent<SubscriptionProps> = ({
  subscriber,
  criteria,
  onDelete,
  typeId,
  groupIndex,
  index,
}) => {
  function characterLimit(string, limit) {
    if (string?.length > limit) {
      const slicedString = string.slice(0, limit);
      return slicedString + '...';
    } else {
      return string;
    }
  }
  const displayOrder = ['email', 'sms', 'bot'];
  const sortedChannels = [];
  displayOrder.forEach((display) => {
    const ix = subscriber.channels.findIndex((channel) => channel.channel === display);
    if (ix !== -1) {
      sortedChannels.push(subscriber.channels[ix]);
    }
  });

  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr>
        <td
          className="address-as"
          headers={`userName_${groupIndex}`}
          data-testid={`userName_${groupIndex}_${index}`}
        >
          {characterLimit(subscriber?.addressAs, 30)}
        </td>
        <td className="channels" headers={`channels_${groupIndex}`} data-testid={`channels_${groupIndex}_${index}`}>
          {sortedChannels.map((channel, i) => (
            <div key={`channels-id-${i}`} style={{ display: 'flex' }}>
              <div>
                <div>
                  {channel.channel === 'email' ? (
                    <IconsCell>
                      <GoabIcon data-testid="mail-icon" size="small" type="mail" ariaLabel="mail" />
                    </IconsCell>
                  ) : channel.channel === 'sms' ? (
                    <IconsCell>
                      <GoabIcon data-testid="sms-icon" size="small" type="phone-portrait" ariaLabel="sms" />
                    </IconsCell>
                  ) : (
                    `${channel.channel}:`
                  )}{' '}
                </div>
              </div>
              <div>
                {characterLimit(channel.channel === 'email' ? channel?.address : phoneWrapper(channel?.address), 30)}
              </div>
            </div>
          ))}
        </td>
        <td className="actions" headers={`actions_${groupIndex}`} data-testid={`actions_${groupIndex}_${index}`}>
          <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
            <GoAContextMenuIcon
              testId={`delete-subscription-${subscriber.id}`}
              title="Delete"
              type="trash"
              onClick={() => onDelete(subscriber, typeId)}
            />
            {criteria[0] && (criteria[0].correlationId || criteria[0].context) && (
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                title="Toggle details"
                onClick={() => {
                  setShowDetails(!showDetails);
                }}
                testId="toggle-details-visibility"
              />
            )}
          </div>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td className="payload-details" colSpan={3}>
            <EntryDetail>
              <div data-testid="subscriber-criteria">{JSON.stringify(criteria, null, 2)}</div>
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};

interface SubscriptionsListComponentProps {
  className?: string;
  onDelete: (subscription: Subscriber, type: string) => void;
  searchCriteria: SubscriptionSearchCriteria;
}

const typeSubscriptionsSelector = createSelector(
  (state: RootState) => state.subscription.typeSubscriptionSearch,
  (state: RootState) => state.notification.notificationTypes,
  (state: RootState) => state.notification.core,
  (state: RootState) => state.subscription.subscriptions,
  (state: RootState) => state.subscription.subscribers,
  (typeSearch, types, coreTypes, subscriptions, subscribers) => {
    const typeSubscriptions = Object.entries(typeSearch)
      .filter(([_typeId, { results }]) => !!results.length)
      .reduce(
        (typeSubs, [typeId, { results }]) => ({
          ...typeSubs,
          [typeId]: results
            .filter((result) => subscriptions[`${typeId}:${result}`])
            .map((result) => ({
              ...subscriptions[`${typeId}:${result}`],
              subscriber: subscribers[result],
            })),
        }),
        {}
      );

    const groups = Object.keys(typeSubscriptions)
      .map((typeId) => coreTypes[typeId] || types[typeId])
      .sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });

    return { groups, typeSubscriptions };
  }
);

const SubscriptionsListComponent: FunctionComponent<SubscriptionsListComponentProps> = ({
  className,
  onDelete,
  searchCriteria,
}) => {
  const dispatch = useDispatch();
  const loading = useSelector((state: RootState) => state.session.indicator.show);
  const { groups, typeSubscriptions } = useSelector(typeSubscriptionsSelector);
  const [editSubscription, setEditSubscription] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  const isFullyLoaded = !loading && groups.length > 0 && Object.keys(typeSubscriptions).length === groups.length;

  if (!isFullyLoaded) {
    return <PageIndicator />;
  }

  if (groups.length === 0) {
    return renderNoItem('subscription');
  }

  const openModalFunction = (subscription) => {
    setSelectedSubscription(subscription);
    setEditSubscription(true);
  };

  function reset() {
    setEditSubscription(false);
  }

  const searchFn = ({ type, searchCriteria }) => {
    if (typeSubscriptions) {
      dispatch(GetTypeSubscriptions(type, searchCriteria, searchCriteria.next));
    }
  };

  return (
    <div className={className} data-testid="subscription-list">
      {groups.map((type, groupIndex) => (
        <div key={type.id} className="subscription-group">
          <div className="group-name">{type.name}</div>
          <DataTable id={`subscription-table-${groupIndex}`} data-testid={`subscription-table-${groupIndex}`}>
            <colgroup>
              <col className="col-address" />
              <col className="col-channels" />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th
                  className="address-as"
                  id={`userName_${groupIndex}`}
                  data-testid={`subscription-header-address-as-${groupIndex}`}
                >
                  Address as
                </th>
                <th
                  className="channels"
                  id={`channels_${groupIndex}`}
                  data-testid={`subscription-header-channels-${groupIndex}`}
                >
                  Channels
                </th>
                <th
                  className="actions"
                  id={`actions_${groupIndex}`}
                  data-testid={`subscription-header-actions-${groupIndex}`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {typeSubscriptions[type.id].map((subscription, index) => (
                <SubscriptionComponent
                  key={`${subscription.subscriber.id}`}
                  subscriber={subscription.subscriber}
                  criteria={subscription.criteria}
                  openModal={openModalFunction}
                  groupIndex={groupIndex}
                  index={index}
                  typeId={subscription.typeId}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </DataTable>
          <SubscriptionNextLoader onSearch={searchFn} type={type.id} searchCriteria={searchCriteria} />
        </div>
      ))}
      {/* Form */}
      <SubscriberModalForm
        open={editSubscription}
        initialValue={selectedSubscription}
        // errors={errors}
        onSave={(subscriber) => {
          dispatch(UpdateSubscriber(subscriber));
          reset();
        }}
        onCancel={() => {
          reset();
        }}
      />
    </div>
  );
};

export const SubscriptionList = styled(SubscriptionsListComponent)`
  display: block;
  width: 100%;

  & .subscription-group {
    width: 100%;
  }

  & .group-name {
    text-transform: capitalize;
    font-size: var(--goa-font-size-5);
    font-weight: var(--fw-bold);
  }

  table {
    width: 100%;
    table-layout: fixed;
    margin-bottom: 2rem;
  }

  & .col-address,
  & .address-as {
    width: 38%;
  }

  & .col-channels,
  & .channels {
    width: 46%;
  }

  & .col-actions,
  & .actions {
    width: 16%;
    text-align: right;
  }

  & td.address-as {
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  & td.actions {
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }
`;

const IconsCell = styled.div`
  display: flex;
  justify-content: space-around;
  width: 90%;
  width: 50%;
  margin: 5px 3px 0 0;
`;
