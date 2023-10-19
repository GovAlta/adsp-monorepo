import React, { FunctionComponent, useState } from 'react';
import { Subscriber } from '@store/subscription/models';
import { phoneWrapper } from '@lib/wrappers';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import styled from 'styled-components';
import { GoAIconButton } from '@abgov/react-components-new';
import { GoAIcon } from '@abgov/react-components-new';
import { RowFlex } from './styled-components';
import { getSubcriberSubscriptions } from './apis';

const IconsCell = styled.div`
  display: flex;
  justify-content: space-around;
  width: 90%;
  width: 50%;
  margin: 5px 3px 0 0;
`;

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
            <div>
              {emailVerified && (
                <IconsCell>
                  <GoAIcon data-testid="mail-icon" size="small" type="shield" />
                </IconsCell>
              )}
            </div>
            <div>{characterLimit(email, 30)}</div>
          </div>
        </td>
        <td className="no-wrap">
          {' '}
          <div style={{ display: 'flex' }}>
            <div>
              {smsVerified && (
                <IconsCell>
                  <GoAIcon data-testid="mail-icon" size="small" type="shield" />
                </IconsCell>
              )}
            </div>
            <div> {phoneWrapper(sms)}</div>
          </div>
        </td>
        {!hideUserActions ? (
          <td>
            <RowFlex>
              <div data-account-link={subscriber.accountLink}>
                <GoAContextMenuIcon
                  type={'person'}
                  onClick={() => {
                    window.open(subscriber.accountLink, '_blank');
                  }}
                  testId="subscriber-account-link"
                />
              </div>
              <GoAContextMenuIcon
                type={showHide ? 'eye-off' : 'eye'}
                onClick={async () => {
                  if (subSubs == null) {
                    const subscriptions = await getSubcriberSubscriptions(subscriber.id);
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
          <td colSpan={3}>
            <h2>Subscriptions</h2>
            {subSubs.length < 1 ? (
              <span>
                <b>No subscriptions</b>
              </span>
            ) : (
              ''
            )}
            {subSubs?.length >= 0
              ? subSubs?.map((typeId, i) => {
                  return (
                    <div data-testid={`subscriptions-${i}`}>
                      <b>{typeId}</b>
                    </div>
                  );
                })
              : ''}
          </td>
        </tr>
      )}
    </>
  );
};
