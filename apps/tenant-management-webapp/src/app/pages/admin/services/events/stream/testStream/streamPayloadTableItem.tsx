import React, { useState } from 'react';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { EntryDetail, NoPaddingTd } from '../styleComponents';

interface StreamPayloadTableItemProps {
  //eslint-disable-next-line
  stream: Record<string, any>;
}

export const StreamPayloadTableItem = ({
  stream: { timestamp, namespace, name, ...stream },
}: StreamPayloadTableItemProps): JSX.Element => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <>
      <tr>
        <td headers="timestamp">
          <span>
            {new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString()}
          </span>
        </td>
        <td headers="namespace">{namespace}</td>
        <td headers="name">{name}</td>
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
            <EntryDetail data-testid={`stream-details`}>{JSON.stringify(stream, null, 2)}</EntryDetail>
          </NoPaddingTd>
        </tr>
      )}
    </>
  );
};
