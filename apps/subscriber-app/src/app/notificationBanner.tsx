import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';

import { GoANotification } from '@abgov/react-components-new';
import { clearNotification } from '@store/notifications/actions';
import { VerifyPhone, VerifyEmail } from '@store/subscription/actions';
import styled from 'styled-components';
import { GoAButton } from '@abgov/react-components-new';

export function NotificationBanner({ loggedIn }: { loggedIn: boolean }): JSX.Element {
  const notification = useSelector((state: RootState) => state.notifications.notification);
  const subscriber = useSelector((state: RootState) => state.subscription.subscriber);
  const dispatch = useDispatch();

  const reVerify = () => {
    const dispatchObject = notification.dispatch.channel === 'email' ? VerifyEmail : VerifyPhone;
    dispatch(dispatchObject(subscriber, !loggedIn));
  };

  return (
    <div>
      {notification ? (
        <div style={{ marginBottom: '10px' }}>
          <GoANotification
            key={new Date().getMilliseconds()}
            onDismiss={() => {
              dispatch(clearNotification());
            }}
            type={notification.type}
          >
            <NotificationStyles>
              <div dangerouslySetInnerHTML={{ __html: notification.message }} />
              {notification?.dispatch && (
                <div className="verification-code-button">
                  <GoAButton size="compact" type="tertiary" testId="subscribe" onClick={reVerify}>
                    Resent verification code
                  </GoAButton>
                </div>
              )}
            </NotificationStyles>
          </GoANotification>
        </div>
      ) : (
        ''
      )}
    </div>
  );
}

export const NotificationStyles = styled.div`
  pre {
    margin: 0 !important;
    padding: 0 !important;
  }

  display: flex;

  .verification-code-button {
    margin-left: 8px;
    margin-top: -4px;
    background: #f75d59;
    border-radius: 5px;
    padding: 2px 1px 2px 0;
  }
`;
