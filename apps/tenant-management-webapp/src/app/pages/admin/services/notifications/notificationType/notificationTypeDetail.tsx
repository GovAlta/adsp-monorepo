import React, { FunctionComponent, ReactNode } from 'react';
import { GoabButton, GoabIconButton } from '@abgov/react-components';
import styled from 'styled-components';
import { NotificationItem } from '@store/notification/models';

interface NotificationTypeDetailProps {
  children: ReactNode;
  onBack: () => void;
}

export const NotificationTypeDetail: FunctionComponent<NotificationTypeDetailProps> = ({ children, onBack }) => {
  return (
    <DetailLayout>
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
    </DetailLayout>
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
    <SummarySection>
      <SummaryContent>
        <Accent />
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
            <StrategyDetail>
              <span>Strategy: From triggering event</span>
              <code>{notificationType.addressPath}</code>
            </StrategyDetail>
          )}
          {notificationType.address && (
            <StrategyDetail>
              <span>Strategy: Configured</span>
              <code>{notificationType.address}</code>
            </StrategyDetail>
          )}
        </div>
      </SummaryContent>
      <SummaryActions>
        <ActionRow>
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
        </ActionRow>
        <StatusGrid>
          <span>Recipient Strategy:</span>
          <StatusPill>{getRecipientStrategy(notificationType)}</StatusPill>
          <span>Public subscription:</span>
          <StatusPill>{notificationType.publicSubscribe ? 'Yes' : 'No'}</StatusPill>
          <span>Self-service allowed:</span>
          <StatusPill>{notificationType.manageSubscribe ? 'Yes' : 'No'}</StatusPill>
        </StatusGrid>
      </SummaryActions>
    </SummarySection>
  );
};

interface DetailSectionProps {
  action?: ReactNode;
  children: ReactNode;
}

export const NotificationTypeEventsSection: FunctionComponent<DetailSectionProps> = ({ action, children }) => (
  <Section>
    <SectionContent>
      <SectionHeader>
        <div>
          <h2>Events</h2>
          <p>These are the events that will trigger notifications for this notification type.</p>
        </div>
        {action && <SectionAction>{action}</SectionAction>}
      </SectionHeader>
      {children}
    </SectionContent>
  </Section>
);

export const NotificationTypeRecipientsSection: FunctionComponent<DetailSectionProps> = ({ action, children }) => (
  <Section>
    <SectionContent>
      <SectionHeader>
        <div>
          <h2>Subscribed recipients</h2>
          <p>These recipients are subscribed to this notification type.</p>
        </div>
        {action && <SectionAction>{action}</SectionAction>}
      </SectionHeader>
      {children}
    </SectionContent>
  </Section>
);

const SectionContent = styled.div`
  padding: 0 var(--goa-space-l);
`;

export const EventCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--goa-space-m);
`;

export const EventCard = styled.div`
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  padding: var(--goa-space-m) var(--goa-space-l);
  min-height: 170px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const EventCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--goa-space-m);
  font-weight: var(--fw-bold);

  > goa-icon-button {
    margin-right: calc(var(--goa-space-xs) * -1);
  }
`;

export const ChannelStatus = styled.div`
  display: grid;
  gap: var(--goa-space-xs);
  color: #555;
`;

export const ChannelStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);
`;

export const EventCardActions = styled.div`
  text-align: right;
`;

export const EmptyRecipients = styled.p`
  margin: var(--goa-space-m) 0 0;
  color: #555;
`;

export const RecipientsTableFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-m);
  padding-top: var(--goa-space-l);
  color: #555;
`;

const getRecipientStrategy = (notificationType: NotificationItem) => {
  if (notificationType.addressPath) {
    return 'From event';
  }

  if (notificationType.address) {
    return 'Configured';
  }

  return 'Subscribers';
};

const DetailLayout = styled.div`
  display: grid;
  gap: var(--goa-space-l);
  padding: 0 var(--goa-space-m) var(--goa-space-l);
`;

const SummarySection = styled.section`
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  padding: var(--goa-space-xl) var(--goa-space-2xl);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--goa-space-xl);
`;

const SummaryContent = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--goa-space-m);

  h2 {
    margin-top: 0;
  }
`;

const Accent = styled.div`
  width: 2px;
  background: var(--color-primary);
`;

const SummaryActions = styled.div`
  border-left: 1px solid #dcdcdc;
  padding-left: var(--goa-space-xl);
  display: grid;
  align-content: start;
  gap: var(--goa-space-l);
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--goa-space-m);
  padding-right: var(--goa-space-s);
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: var(--goa-space-s) var(--goa-space-m);
  padding-right: var(--goa-space-s);
`;

const StatusPill = styled.span`
  background: #eee;
  border-radius: 1rem;
  padding: 0.25rem 0.75rem;
  font-weight: var(--fw-bold);
`;

const StrategyDetail = styled.p`
  display: grid;
  gap: var(--goa-space-xs);

  code {
    font-family: var(--goa-font-family-monospace);
    overflow-wrap: anywhere;
  }
`;

const Section = styled.section`
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  padding: var(--goa-space-l) 0 var(--goa-space-2xl);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--goa-space-m);
  margin-bottom: var(--goa-space-m);

  h2 {
    margin-top: 0;
    margin-bottom: var(--goa-space-xs);
  }
`;

const SectionAction = styled.div`
  flex-shrink: 0;
  padding-top: var(--goa-space-s);
`;
