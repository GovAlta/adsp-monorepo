import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { TableDiv, MoreDetails } from '../styled-components';
import { useState } from 'react';

import { GoAContextMenuIcon } from '@components/ContextMenu';
import { SharepointConnection } from '@store/sharePoint/actions';

interface CalendarItemProps {
  connection: SharepointConnection;
  onEdit?: (connection: SharepointConnection, tenantMode: boolean) => void;
  onDelete?: (connection: SharepointConnection) => void;
  tenantMode: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
}

const ConnectionItemComponent: FunctionComponent<CalendarItemProps> = ({
  connection,
  onDelete,
  onEdit,
  tenantMode,
  showDetails,
  onToggleDetails,
}: CalendarItemProps) => {
  return (
    <>
      <tr key={connection.id}>
        <td headers="connection-name">{connection.name}</td>
        <td headers="connection-siteId">{connection.siteId}</td>
        <td headers="connection-listId">{connection.listId}</td>
        <td headers="connection-actions">
          <div>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={onToggleDetails}
              testId="toggle-details-visibility"
            />
            <GoAContextMenuIcon
              type={tenantMode ? 'create' : 'eye'}
              title={tenantMode ? 'Edit' : 'View'}
              testId={`connection-edit-${connection.id}`}
              onClick={() => {
                onEdit(connection, tenantMode);
              }}
            />

            {tenantMode && (
              <GoAContextMenuIcon
                testId="delete-icon"
                title="Delete"
                type="trash"
                onClick={() => {
                  onDelete(connection);
                }}
              />
            )}
          </div>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td
            colSpan={5}
            style={{
              padding: '0px',
            }}
          >
            <MoreDetails>
              <p>Id</p>
              <span>{connection.id}</span>

              <p>Tenant ID</p>
              <span>{connection.tenantId}</span>
              <p>SharePoint site ID</p>
              <span>{connection.siteId}</span>
              <p>SharePoint list ID</p>
              <span>{connection.listId}</span>
              <p>Client ID</p>
              <span>{connection.clientId}</span>
            </MoreDetails>
          </td>
        </tr>
      )}
    </>
  );
};

interface calendarTableProps {
  connections: Record<string, SharepointConnection>;
  onEdit?: (connection: SharepointConnection, tenantMode: boolean) => void;
  onDelete?: (connection: SharepointConnection) => void;
  tenantMode?: boolean;
}

export const ConnectionTableComponent: FunctionComponent<calendarTableProps> = ({
  connections,
  onEdit,
  onDelete,
  tenantMode,
}) => {
  const [activeRow, setActiveRow] = useState(null);
  return (
    <TableDiv key="connection">
      <DataTable data-testid="connection-table">
        <thead data-testid="connection-table-header">
          <tr>
            <th id="connection-name" data-testid="connection-table-name" style={{ width: '25%' }}>
              Connection name
            </th>
            <th id="connection-site-id" data-testid="connection-table-header-id" style={{ width: '25%' }}>
              Site ID
            </th>
            <th id="connection-list-id" data-testid="connection-table-header-description" style={{ width: '25%' }}>
              List ID
            </th>
            <th id="connection-action" data-testid="connection-table-header-actions" style={{ width: '25%' }}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody key="connection-detail">
          {Object.keys(connections).map((connectionName) => (
            <ConnectionItemComponent
              key={connectionName}
              connection={connections[connectionName]}
              onEdit={onEdit}
              onDelete={onDelete}
              tenantMode={tenantMode}
              showDetails={activeRow === connections[connectionName]['id']}
              onToggleDetails={() => {
                setActiveRow(
                  activeRow === connections[connectionName]['id'] ? null : connections[connectionName]['id'],
                );
              }}
            />
          ))}
        </tbody>
      </DataTable>
      <br />
    </TableDiv>
  );
};
