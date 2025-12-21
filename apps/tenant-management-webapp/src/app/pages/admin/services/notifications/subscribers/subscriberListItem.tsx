import React, { FunctionComponent, useState } from 'react';
import { Subscriber } from '@store/subscription/models';
import { phoneWrapper } from '@lib/wrappers';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import styled from 'styled-components';
import { GoABadge } from '@abgov/react-components';
import { RowFlex } from './styled-components';
import { getSubscriberSubscriptions } from './apis';
import { EntryDetail } from '../../styled-components';
interface ActionComponentProps {
  subscriber: Subscriber;
  openModalFunction?: (subscriber: Subscriber) => void;
  openDeleteModalFunction?: (subscriber: Subscriber) => void;
  hideUserActions?: boolean;
}

export const SubscriberListItem: FunctionComponent<ActionComponentProps> = ({
  subscriber,
  openModalFunction,
  hideUserActions = false,
  openDeleteModalFunction,
}) => {
  // TODO: this should be overflow ellipse as a css style instead of modifying value in DOM?
  function characterLimit(string, limit) {
    if (string?.length > limit) {
      const slicedString = string.slice(0, limit);
      return slicedString + '...';
    } else {
      return string;
    }
  }

  const [subSubs, setSubSubs] = useState(null);
  const [showHide, setShowHide] = useState(false);

  const email = subscriber?.channels?.find(({ channel }) => channel === 'email')?.address;
  const sms = subscriber?.channels?.find(({ channel }) => channel === 'sms')?.address;
  const emailVerified = subscriber?.channels?.find(({ channel }) => channel === 'email')?.verified;
  const smsVerified = subscriber?.channels?.find(({ channel }) => channel === 'sms')?.verified;
  return (
    <>
      <tr key={subscriber.id}>
        <td>{characterLimit(subscriber?.addressAs, 30)}</td>
        <td>
          <div style={{ display: 'flex' }}>
            {email && (
              <GoABadgeWrapper>
                {emailVerified ? (
                  <GoABadge key="email-verified" type="success" content="Verified" icon={false} />
                ) : (
                  <GoABadge key="email-not-verified" type="important" content="Not verified" icon={false} />
                )}
              </GoABadgeWrapper>
            )}
            <div>{characterLimit(email, 30)}</div>
          </div>
        </td>
        {!hideUserActions ? (
          <td className="no-wrap">
            <div style={{ display: 'flex' }}>
              {sms && (
                <GoABadgeWrapper>
                  {smsVerified ? (
                    <GoABadge key="sms-verified" type="success" content="Verified" icon={false} />
                  ) : (
                    <GoABadge key="sms-not-verified" type="important" content="Not verified" icon={false} />
                  )}
                </GoABadgeWrapper>
              )}
              <div>{phoneWrapper(sms)}</div>
            </div>
          </td>
        ) : (
          ''
        )}
        {!hideUserActions ? (
          <td>
            <RowFlex>
              <div data-account-link={subscriber.accountLink}>
                <GoAContextMenuIcon
                  type={'person'}
                  title="Person"
                  onClick={() => {
                    window.open(subscriber.accountLink, '_blank');
                  }}
                  testId="subscriber-account-link"
                />
              </div>
              <GoAContextMenuIcon
                type={showHide ? 'eye-off' : 'eye'}
                title="Toggle details"
                onClick={async () => {
                  if (subSubs == null) {
                    const subscriptions = await getSubscriberSubscriptions(subscriber.id);
                    setSubSubs(subscriptions);
                    setShowHide(true);
                  } else {
                    setShowHide(!showHide);
                  }
                }}
                testId="toggle-details-visibility"
              />
              <GoAContextMenuIcon
                type="create"
                title="Edit"
                onClick={() => openModalFunction(subscriber)}
                testId={`edit-subscription-item-${subscriber.id}`}
              />

              <GoAContextMenuIcon
                testId="delete-icon"
                type="trash"
                title="Delete"
                onClick={() => {
                  openDeleteModalFunction(subscriber);
                }}
              />
            </RowFlex>
          </td>
        ) : (
          ''
        )}
      </tr>
      {showHide && (
        <tr>
          <td colSpan={4}>
            <EntryDetail>
              <h2>Subscriptions</h2>
              {subSubs.length === 0 ? (
                <span>
                  <b>No subscriptions</b>
                </span>
              ) : (
                subSubs.map((typeId, i) => (
                  <div key={i} data-testid={`subscriptions-${i}`}>
                    <b>{typeId}</b>
                  </div>
                ))
              )}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};

const GoABadgeWrapper = styled.div`
  margin-right: var(--goa-space-s);
  text-wrap: nowrap;
`;
