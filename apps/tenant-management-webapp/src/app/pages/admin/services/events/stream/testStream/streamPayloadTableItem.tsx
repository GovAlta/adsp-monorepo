import React, { useState } from 'react';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { EntryDetail, NoPaddingTd } from '../styleComponents';

interface StreamPayloadTableItemProps {
  stream: Record<string, any>;
}

export const StreamPayloadTableItem = ({ stream }: StreamPayloadTableItemProps): JSX.Element => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <>
      <tr>
        <td headers="timestamp">
          <span>
            {new Date(stream.timestamp).toLocaleDateString()} {new Date(stream.timestamp).toLocaleTimeString()}
          </span>
        </td>
        <td headers="namespace">{stream.namespace}</td>
        <td headers="name">{stream.name}</td>
        <td headers="action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={() => setShowDetails(!showDetails)}
              testId="toggle-details-visibility"
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <NoPaddingTd colSpan={5}>
            <EntryDetail data-testid={`stream-details`}>{JSON.stringify(stream.payload, null, 2)}</EntryDetail>
          </NoPaddingTd>
        </tr>
      )}
    </>
  );
};
