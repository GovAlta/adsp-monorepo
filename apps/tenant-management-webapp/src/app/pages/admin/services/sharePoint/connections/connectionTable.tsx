import React, { FunctionComponent, useState } from 'react';
import DataTable from '@components/DataTable';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { SharepointConnection } from '@store/sharePoint/actions';
import { MoreDetails, TableDiv } from '../styled-components';

interface ConnectionTableProps {
  connections: Record<string, SharepointConnection>;
  onEdit: (connection: SharepointConnection) => void;
  onDelete: (connection: SharepointConnection) => void;
}

export const ConnectionTableComponent: FunctionComponent<ConnectionTableProps> = ({
  connections,
  onEdit,
  onDelete,
}) => {
  const [activeRow, setActiveRow] = useState<string | null>(null);

  return (
    <TableDiv key="connection">
      <DataTable data-testid="connection-table">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Connection name</th>
            <th style={{ width: '50%' }}>Site ID</th>
            <th style={{ width: '20%' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.values<SharepointConnection>(connections).map((connection) => (
            <React.Fragment key={connection.id}>
              <tr>
                <td>{connection.name}</td>
                <td>{connection.siteId}</td>
                <td>
                  <GoAContextMenuIcon
                    title="Toggle details"
                    type={activeRow === connection.id ? 'eye-off' : 'eye'}
                    testId={`connection-details-${connection.id}`}
                    onClick={() => setActiveRow(activeRow === connection.id ? null : connection.id)}
                  />
                  <GoAContextMenuIcon
                    type="create"
                    title="Edit"
                    testId={`connection-edit-${connection.id}`}
                    onClick={() => onEdit(connection)}
                  />
                  <GoAContextMenuIcon
                    type="trash"
                    title="Delete"
                    testId={`connection-delete-${connection.id}`}
                    onClick={() => onDelete(connection)}
                  />
                </td>
              </tr>
              {activeRow === connection.id && (
                <tr>
                  <td colSpan={3} style={{ padding: 0 }}>
                    <MoreDetails>
                      <p>Connection ID</p>
                      <span>{connection.id}</span>
                      <p>Entra tenant ID</p>
                      <span>{connection.entraTenantId}</span>
                      <p>Client ID</p>
                      <span>{connection.clientId}</span>
                      <p>SharePoint site ID</p>
                      <span>{connection.siteId}</span>
                    </MoreDetails>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </DataTable>
      <br />
    </TableDiv>
  );
};
