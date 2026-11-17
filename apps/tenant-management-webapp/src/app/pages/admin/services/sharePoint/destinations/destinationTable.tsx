import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { SharepointConnection, SharepointDestination } from '@store/sharePoint/actions';
import { TableDiv } from '../styled-components';

interface DestinationTableProps {
  destinations: Record<string, SharepointDestination>;
  connections: Record<string, SharepointConnection>;
  onTest: (destination: SharepointDestination) => void;
  onEdit: (destination: SharepointDestination) => void;
  onDelete: (destination: SharepointDestination) => void;
}

export const DestinationTableComponent: FunctionComponent<DestinationTableProps> = ({
  destinations,
  connections,
  onTest,
  onEdit,
  onDelete,
}) => (
  <TableDiv key="destination">
    <DataTable data-testid="destination-table">
      <thead>
        <tr>
          <th style={{ width: '25%' }}>Destination</th>
          <th style={{ width: '15%' }}>ID</th>
          <th style={{ width: '20%' }}>Connection</th>
          <th style={{ width: '10%' }}>Mappings</th>
          <th style={{ width: '10%' }}>Status</th>
          <th style={{ width: '20%' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {Object.values<SharepointDestination>(destinations).map((destination) => (
          <tr key={destination.id}>
            <td>{destination.name}</td>
            <td>{destination.id}</td>
            <td>{connections[destination.connectionId]?.name ?? `Missing (${destination.connectionId})`}</td>
            <td>{destination.fieldMappings.length}</td>
            <td>{destination.enabled === false ? 'Disabled' : 'Enabled'}</td>
            <td>
              <GoAContextMenuIcon
                type="flask"
                title="Test"
                testId={`destination-test-${destination.id}`}
                onClick={() => onTest(destination)}
              />
              <GoAContextMenuIcon
                type="create"
                title="Edit"
                testId={`destination-edit-${destination.id}`}
                onClick={() => onEdit(destination)}
              />
              <GoAContextMenuIcon
                type="trash"
                title="Delete"
                testId={`destination-delete-${destination.id}`}
                onClick={() => onDelete(destination)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  </TableDiv>
);
