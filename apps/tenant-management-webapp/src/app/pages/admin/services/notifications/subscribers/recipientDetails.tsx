import React, { FunctionComponent } from 'react';
import type { Subscriber } from '@store/subscription/models';
import { GoabBadge, GoabIcon } from '@abgov/react-components';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { phoneWrapper } from '@lib/wrappers';
import styled from 'styled-components';
import { formatDate, getChannelAddress, isVerified } from './recipient';

// Shown where a recipient holds no address for a channel.
const EMPTY = '—';

interface RecipientDetailsProps {
  subscriber: Subscriber;
  onEdit: (subscriber: Subscriber) => void;
  onDelete: (subscriber: Subscriber) => void;
  onClose: () => void;
}

export const RecipientDetails: FunctionComponent<RecipientDetailsProps> = ({
  subscriber,
  onEdit,
  onDelete,
  onClose,
}) => {
  if (!subscriber) {
    return (
      <DetailsPane data-testid="recipient-details-empty">
        <EmptyMessage>Select a recipient to see their contact information.</EmptyMessage>
      </DetailsPane>
    );
  }

  const email = getChannelAddress(subscriber, 'email');
  const sms = getChannelAddress(subscriber, 'sms');

  return (
    <DetailsPane data-testid="recipient-details">
      <HeaderBand>
        <DetailsHeader>
          <h3 data-testid="recipient-details-name">{subscriber.addressAs}</h3>
          <DetailsActions>
            {subscriber.accountLink && (
              <GoAContextMenuIcon
                type="person"
                title="Person"
                testId="recipient-details-account-link"
                onClick={() => window.open(subscriber.accountLink, '_blank')}
              />
            )}
            <GoAContextMenuIcon
              type="create"
              title="Edit"
              testId={`recipient-details-edit-${subscriber.id}`}
              onClick={() => onEdit(subscriber)}
            />
            <GoAContextMenuIcon
              type="trash"
              title="Delete"
              testId="recipient-details-delete"
              onClick={() => onDelete(subscriber)}
            />
            <GoAContextMenuIcon type="close" title="Close" testId="recipient-details-close" onClick={onClose} />
          </DetailsActions>
        </DetailsHeader>

        <BadgeRow data-testid="recipient-details-verification">
          {isVerified(subscriber) ? (
            <GoabBadge type="success" content="Verified" icon={false} />
          ) : (
            <GoabBadge type="important" content="Not verified" icon={false} />
          )}
        </BadgeRow>
      </HeaderBand>

      <h4>Contact information</h4>
      <ContactRow>
        <GoabIcon size="small" type="mail" ariaLabel="email" />
        <span data-testid="recipient-details-email">{email || EMPTY}</span>
      </ContactRow>
      <ContactRow>
        <GoabIcon size="small" type="call" ariaLabel="phone" />
        <span data-testid="recipient-details-phone">{sms ? phoneWrapper(sms) : EMPTY}</span>
      </ContactRow>
      <ContactRow>
        <GoabIcon size="small" type="id-card" ariaLabel="address as" />
        <div>
          <FieldLabel>Address as</FieldLabel>
          <div data-testid="recipient-details-address-as">{subscriber.addressAs}</div>
        </div>
      </ContactRow>

      <Divider />

      <DatesSection>
        <FieldLabel>Created</FieldLabel>
        <div data-testid="recipient-details-created">{formatDate(subscriber.created)}</div>
        <FieldLabel>Last updated</FieldLabel>
        <div data-testid="recipient-details-updated">{formatDate(subscriber.updated)}</div>
      </DatesSection>
    </DetailsPane>
  );
};

const DetailsPane = styled.div`
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  padding: var(--goa-space-m);
  min-width: 0;
  word-break: break-word;

  h3 {
    margin: 0;
  }

  h4 {
    margin: 0 0 var(--goa-space-s) 0;
  }
`;

const EmptyMessage = styled.p`
  margin: 0;
  color: var(--goa-color-text-secondary);
`;

// Bleeds past the card's own padding so the tint reaches its edges, then reintroduces that padding
// for its own content.
const HeaderBand = styled.div`
  background: #f1f8fe;
  margin: calc(-1 * var(--goa-space-m)) calc(-1 * var(--goa-space-m)) 0;
  padding: var(--goa-space-m) var(--goa-space-m) var(--goa-space-s);
  border-radius: var(--goa-border-radius-m) var(--goa-border-radius-m) 0 0;
  margin-bottom: var(--goa-space-m);
  padding-bottom: var(--goa-space-s);
`;

const DetailsHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--goa-space-s);
`;

const DetailsActions = styled.div`
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
`;

const BadgeRow = styled.div`
  margin-top: var(--goa-space-xs);
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--goa-color-greyscale-200);
  margin: var(--goa-space-m) 0;
`;

// The icon names the kind of address, so the value stands on its own without a label beside it.
const ContactRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--goa-space-s);
  margin-bottom: var(--goa-space-s);
`;

const FieldLabel = styled.div`
  color: var(--goa-color-text-secondary);
`;

const DatesSection = styled.div`
  display: grid;
  gap: 2px;

  > div:nth-child(2) {
    margin-bottom: var(--goa-space-s);
  }
`;
