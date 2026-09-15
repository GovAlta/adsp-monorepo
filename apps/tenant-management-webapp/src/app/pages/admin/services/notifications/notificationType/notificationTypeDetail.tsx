import React, { FunctionComponent, ReactNode } from 'react';
import { GoabButton } from '@abgov/react-components';

interface NotificationTypeDetailProps {
  children: ReactNode;
  onBack: () => void;
}

export const NotificationTypeDetail: FunctionComponent<NotificationTypeDetailProps> = ({ children, onBack }) => {
  return (
    <>
      <GoabButton type="secondary" size="compact" testId="back-to-notification-types" onClick={onBack}>
        Back
      </GoabButton>
      {children}
    </>
  );
};
