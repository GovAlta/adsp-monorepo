import DataTable from '@components/DataTable';
import React from 'react';
import { Streams } from '@store/stream/models';
import { TableDiv, TableWrapper } from './styleComponents';
import { renderNoItem } from '@components/NoItem';
import { StreamTableItem } from './streamTableItem';
interface StreamTableProps {
  streams: Streams;
  namespace: string;
  isTenantSpecificStream: boolean;
  onDelete?: (streamId: string) => void;
  onEdit?: (streamId: string) => void;
}

export const StreamTable = ({
  onDelete,
  onEdit,
  streams,
  namespace,
  isTenantSpecificStream,
}: StreamTableProps): JSX.Element => {
  delete streams['webhooks'];
  const hasContent = Object.entries(streams).length > 0;
  return (
    <TableWrapper key={`${namespace}-stream-table`}>
      <TableDiv key={`${namespace}-stream-table`}>
        <DataTable key={`${namespace}-stream-table`} data-testid={`${namespace}-stream-table`}>
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
            {hasContent &&
              Object.entries(streams)
                .sort((a, b) => (a < b ? -1 : 1))
                .map(([id, stream]) => {
                  return (
                    <StreamTableItem
                      onDelete={onDelete}
                      onEdit={onEdit}
                      isTenantSpecificStream={isTenantSpecificStream}
                      key={id}
                      stream={stream}
                    />
                  );
                })}
            {!hasContent && (
              <tr>
                <td colSpan={3}>{renderNoItem('stream', true)}</td>
              </tr>
            )}
          </tbody>
        </DataTable>
      </TableDiv>
    </TableWrapper>
  );
};
