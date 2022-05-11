import DataTable from '@components/DataTable';
import React, { useState } from 'react';
import { Streams } from '@store/stream/models';
import { TableWrapper, EntryDetail, NoPaddingTd } from './styleComponents';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { Badge } from './styleComponents';
import { adspId } from '@lib/adspId';
import { renderNoItem } from '@components/NoItem';

interface StreamTableProps {
  streams: Streams;
  isCore: boolean;
  namespace: string;
}

interface SubscriberRolesProps {
  roles: string[];
}

const SubscriberRoles = ({ roles }: SubscriberRolesProps): JSX.Element => {
  return (
    <td>
      {roles.map((role): JSX.Element => {
        return <Badge>{adspId`${role}`.toStringWithOutPrefix()}</Badge>;
      })}
    </td>
  );
};

export const StreamTable = ({ streams, namespace }: StreamTableProps): JSX.Element => {
  const [showId, setShowId] = useState<string>(null);
  const hasContent = Object.entries(streams).length > 0;
  return (
    <TableWrapper key={`${namespace}-stream-table`}>
      <DataTable data-testid={`${namespace}-stream-table`}>
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
            Object.entries(streams).map(([id, stream]) => {
              return (
                <>
                  <tr>
                    <td data-testid={`stream-name-${id}`}>{stream.name}</td>
                    <SubscriberRoles roles={stream.subscriberRoles} />
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
                  {showId === id && (
                    <tr>
                      <NoPaddingTd colSpan={3}>
                        <EntryDetail data-testid={`details-${id}`}>{JSON.stringify(stream, null, 2)}</EntryDetail>
                      </NoPaddingTd>
                    </tr>
                  )}
                </>
              );
            })}
          {!hasContent && (
            <tr>
              <td colSpan={3}>{renderNoItem('stream', true)}</td>
            </tr>
          )}
        </tbody>
      </DataTable>
    </TableWrapper>
  );
};
