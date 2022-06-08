import React from 'react';
import DataTable from '@components/DataTable';
import { StreamPayloadTableItem } from './streamPayloadTableItem';

interface StreamPayloadTableProps {
  streams: Record<string, any>[];
}

export const StreamPayloadTable = ({ streams }: StreamPayloadTableProps): JSX.Element => {
  return (
    <DataTable>
      <thead>
        <tr>
          <th id="timestamp">Timestamp</th>
          <th id="namespace">Namespace</th>
          <th id="name">Name</th>
          <th id="action">Action</th>
        </tr>
      </thead>
      <tbody>
        {streams?.map((streamData) => (
          <StreamPayloadTableItem key={streamData.timestamp} stream={streamData} />
        ))}
      </tbody>
    </DataTable>
  );
};
