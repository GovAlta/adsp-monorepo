import React, { FunctionComponent } from 'react';
import { GoabFormItem, GoabInput, GoabTable } from '@abgov/react-components';
import type { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { NotificationItem } from '@store/notification/models';
import styled from 'styled-components';

interface NotificationTypesListProps {
  searchTerm: string;
  tenantNotificationTypes: NotificationItem[];
  coreNotificationTypes: NotificationItem[];
  onSearchChange: (value: string) => void;
  onSelect: (notificationType: NotificationItem) => void;
}

const renderNotificationTypeRows = (
  notificationTypes: NotificationItem[],
  onSelect: (notificationType: NotificationItem) => void,
) =>
  notificationTypes.map((notificationType) => (
    <tr
      key={`notification-type-row-${notificationType.id}`}
      onClick={() => onSelect(notificationType)}
      style={{ cursor: 'pointer' }}
    >
      <td>{notificationType.name}</td>
      <td>{notificationType.id}</td>
      <td>{notificationType.publicSubscribe ? 'Yes' : 'No'}</td>
      <td>{notificationType.manageSubscribe ? 'Yes' : 'No'}</td>
    </tr>
  ));

export const NotificationTypesList: FunctionComponent<NotificationTypesListProps> = ({
  searchTerm,
  tenantNotificationTypes,
  coreNotificationTypes,
  onSearchChange,
  onSelect,
}) => {
  return (
    <NotificationTypesListLayout>
      <GoabFormItem label="Search notification types">
        <GoabInput
          size="compact"
          name="notification-type-search"
          testId="notification-type-search"
          width="100%"
          value={searchTerm}
          onChange={(detail: GoabInputOnChangeDetail) => onSearchChange(detail.value)}
        />
      </GoabFormItem>
      <GoabTable testId="notification-types-table" width="100%">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type ID</th>
            <th>Public subscription</th>
            <th>Self-service subscription</th>
          </tr>
        </thead>
        <tbody>{renderNotificationTypeRows(tenantNotificationTypes, onSelect)}</tbody>
      </GoabTable>
      {tenantNotificationTypes.length === 0 && <p>No notification types found.</p>}

      <h2>Core notifications:</h2>
      <GoabTable testId="core-notification-types-table" width="100%">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type ID</th>
            <th>Public subscription</th>
            <th>Self-service subscription</th>
          </tr>
        </thead>
        <tbody>{renderNotificationTypeRows(coreNotificationTypes, onSelect)}</tbody>
      </GoabTable>
      {coreNotificationTypes.length === 0 && <p>No core notification types found.</p>}
    </NotificationTypesListLayout>
  );
};

const NotificationTypesListLayout = styled.div`
  padding: var(--goa-space-l) 0 0;

  > goa-table {
    display: block;
    margin-top: var(--goa-space-m);
  }

  > h2 {
    margin-top: var(--goa-space-xl);
  }
`;
