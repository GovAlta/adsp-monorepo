import DataTable from '@components/DataTable';
import React, { useState } from 'react';
import { Streams } from '@store/stream/models';
import { TableWrapper } from './styleComponents';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

interface StreamTableProps {
  streams: Streams;
  isCore: boolean;
  namespace: string;
}

export const StreamTable = ({ streams, namespace }: StreamTableProps): JSX.Element => {
  const [showId, setShowId] = useState<string>(null);
  return (
    <TableWrapper key={`${namespace}-stream-table`}>
      <DataTable data-testid="stream-table">
        <thead data-testid="stream-table-header">
          <tr>
            <th id="stream-service-name" data-testid="stream-table-header-name">
              Name
            </th>

            <th id="stream-service-subscriber-roles" data-testid="stream-table-header-subscriber-roles">
              Subscriber roles
            </th>

            <th id="stream-service-actions" data-testid="stream-table-header-actions">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(streams).map(([id, stream]) => {
            return (
              <tr>
                <td>{stream.name}</td>
                <td>{stream.subscriberRoles}</td>
                <td>
                  <GoAContextMenu>
                    <GoAContextMenuIcon
                      type={showId === id ? 'eye-off' : 'eye'}
                      onClick={() => {
                        if (showId) {
                          setShowId(null);
                        } else {
                          setShowId(id);
                        }
                      }}
                      testId="toggle-event-visibility"
                    />
                  </GoAContextMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </TableWrapper>
  );
};
