import React, { useState } from 'react';
import { Stream } from '@store/stream/models';
import { EntryDetail, IconDiv, NoPaddingTd } from './styleComponents';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoABadge } from '@abgov/react-components/experimental';

interface SubscriberRolesProps {
  roles: string[];
}

const SubscriberRoles = ({ roles }: SubscriberRolesProps): JSX.Element => {
  return (
    <td>
      {roles.map((role): JSX.Element => {
        return <GoABadge key={`roles-${role}`} type="information" content={role} />;
      })}
    </td>
  );
};

interface StreamTableItemProps {
  stream: Stream;
  isTenantSpecificStream: boolean;
  onDelete?: (streamId: string) => void;
  onEdit?: (streamId: string) => void;
}
export const StreamTableItem = ({
  onEdit,
  stream,
  isTenantSpecificStream,
  onDelete,
}: StreamTableItemProps): JSX.Element => {
  const [showStream, setShowStream] = useState(false);

  return (
    <>
      <tr>
        <td data-testid={`stream-name-${stream?.id}`}>{stream?.name}</td>
        <SubscriberRoles roles={stream?.subscriberRoles} />
        <td>
          <IconDiv>
            <GoAContextMenu>
              <GoAContextMenuIcon
                type={showStream ? 'eye-off' : 'eye'}
                onClick={() => setShowStream(!showStream)}
                testId={`toggle-event-visibility-${stream?.id}`}
              />
            </GoAContextMenu>
            {isTenantSpecificStream ? (
              <>
                <GoAContextMenuIcon type="create" onClick={() => onEdit(stream.id)} testId="edit-details" />
                <GoAContextMenuIcon type="trash" onClick={() => onDelete(stream.id)} testId="delete-config" />
              </>
            ) : (
              ''
            )}
          </IconDiv>
        </td>
      </tr>
      {showStream && (
        <tr>
          <NoPaddingTd colSpan={3}>
            <EntryDetail data-testid={`stream-details-${stream?.id}`}>{JSON.stringify(stream, null, 2)}</EntryDetail>
          </NoPaddingTd>
        </tr>
      )}
    </>
  );
};
