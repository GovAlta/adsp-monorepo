import React, { FunctionComponent, ReactNode } from 'react';
import { GoabButton, GoabIconButton } from '@abgov/react-components';
import { NotificationItem } from '@store/notification/models';
import {
  NotificationTypeActionRow,
  NotificationTypeDetailLayout,
  NotificationTypeSection,
  NotificationTypeSectionAction,
  NotificationTypeSectionContent,
  NotificationTypeSectionHeader,
  NotificationTypePathGrid,
  NotificationTypeStatusGrid,
  NotificationTypeStatusPill,
  NotificationTypeStrategyDetail,
  NotificationTypeSummaryActions,
  NotificationTypeSummaryContent,
  NotificationTypeSummarySection,
} from '../styled-components';

interface NotificationTypeDetailProps {
  children: ReactNode;
  onBack: () => void;
}

export const NotificationTypeDetail: FunctionComponent<NotificationTypeDetailProps> = ({ children, onBack }) => {
  return (
    <NotificationTypeDetailLayout>
      <GoabButton
        type="text"
        size="compact"
        leadingIcon="chevron-back"
        testId="back-to-notification-types"
        onClick={onBack}
      >
        Back to notification types
      </GoabButton>
      {children}
    </NotificationTypeDetailLayout>
  );
};

interface NotificationTypeSummaryProps {
  notificationType: NotificationItem;
  isCore?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const NotificationTypeSummary: FunctionComponent<NotificationTypeSummaryProps> = ({
  notificationType,
  isCore,
  onEdit,
  onDelete,
}) => {
  return (
    <NotificationTypeSummarySection>
      <NotificationTypeSummaryContent>
        <div>
          <h2>{notificationType.name}</h2>

          <span>Type ID: {notificationType.id}</span>
          <GoabIconButton
            icon="copy"
            size="small"
            title="Copy Type ID"
            testId="copy-notification-type-id"
            onClick={() => navigator.clipboard.writeText(notificationType.id)}
          />

          <p style={{ paddingTop: '6px' }}>Description: {notificationType.description}</p>
          {notificationType.addressPath && (
            <NotificationTypeStrategyDetail>
              <span>Strategy: From triggering event</span>
              <NotificationTypePathGrid>
                <span>Contact:</span>
                <code>{notificationType.addressPath}</code>
                {notificationType.bccPath && (
                  <>
                    <span>Bcc:</span>
                    <code>{notificationType.bccPath}</code>
                  </>
                )}
                {notificationType.ccPath && (
                  <>
                    <span>Cc:</span>
                    <code>{notificationType.ccPath}</code>
                  </>
                )}
                {notificationType.attachmentPath && (
                  <>
                    <span>Attachment:</span>
                    <code>{notificationType.attachmentPath}</code>
                  </>
                )}
              </NotificationTypePathGrid>
            </NotificationTypeStrategyDetail>
          )}
          {notificationType.address && (
            <NotificationTypeStrategyDetail>
              <span>Strategy: Configured</span>
              <code>{notificationType.address}</code>
            </NotificationTypeStrategyDetail>
          )}
          {!notificationType.address && !notificationType.addressPath && (
            <NotificationTypeStrategyDetail data-testid="subscriber-roles">
              <span>Subscriber roles:</span>
              <code>{getSubscriberRoles(notificationType)}</code>
            </NotificationTypeStrategyDetail>
          )}
        </div>
      </NotificationTypeSummaryContent>
      <NotificationTypeSummaryActions>
        <NotificationTypeActionRow>
          <GoabButton
            size="compact"
            type="secondary"
            leadingIcon="create"
            testId="edit-notification-type"
            onClick={onEdit}
          >
            Edit
          </GoabButton>
          {!isCore && (
            <GoabButton
              size="compact"
              type="secondary"
              variant="destructive"
              leadingIcon="trash"
              testId="delete-notification-type"
              onClick={onDelete}
            >
              Delete
            </GoabButton>
          )}
        </NotificationTypeActionRow>
        <NotificationTypeStatusGrid>
          <span>Recipient Strategy:</span>
          <NotificationTypeStatusPill>{getRecipientStrategy(notificationType)}</NotificationTypeStatusPill>
          <span>Public subscription:</span>
          <NotificationTypeStatusPill>{notificationType.publicSubscribe ? 'Yes' : 'No'}</NotificationTypeStatusPill>
          <span>Self-service allowed:</span>
          <NotificationTypeStatusPill>{notificationType.manageSubscribe ? 'Yes' : 'No'}</NotificationTypeStatusPill>
        </NotificationTypeStatusGrid>
      </NotificationTypeSummaryActions>
    </NotificationTypeSummarySection>
  );
};

interface DetailSectionProps {
  action?: ReactNode;
  children: ReactNode;
}

export const NotificationTypeEventsSection: FunctionComponent<DetailSectionProps> = ({ action, children }) => (
  <NotificationTypeSection>
    <NotificationTypeSectionContent>
      <NotificationTypeSectionHeader>
        <div>
          <h2>Events</h2>
          <p>These are the events that will trigger notifications for this notification type.</p>
        </div>
        {action && <NotificationTypeSectionAction>{action}</NotificationTypeSectionAction>}
      </NotificationTypeSectionHeader>
      {children}
    </NotificationTypeSectionContent>
  </NotificationTypeSection>
);

export const NotificationTypeRecipientsSection: FunctionComponent<DetailSectionProps> = ({ action, children }) => (
  <NotificationTypeSection>
    <NotificationTypeSectionContent>
      <NotificationTypeSectionHeader>
        <div>
          <h2>Subscribed recipients</h2>
          <p>These recipients are subscribed to this notification type.</p>
        </div>
        {action && <NotificationTypeSectionAction>{action}</NotificationTypeSectionAction>}
      </NotificationTypeSectionHeader>
      {children}
    </NotificationTypeSectionContent>
  </NotificationTypeSection>
);

const getRecipientStrategy = (notificationType: NotificationItem) => {
  if (notificationType.addressPath) {
    return 'From event';
  }

  if (notificationType.address) {
    return 'Configured';
  }

  return 'Subscribers';
};

const getSubscriberRoles = (notificationType: NotificationItem) => {
  const subscriberRoles = notificationType.subscriberRoles?.filter((value) => value !== 'anonymousRead') || [];
  return subscriberRoles.length > 0 ? subscriberRoles.join(', ') : 'None';
};
