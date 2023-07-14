import React, { useState } from 'react';
import { Stream } from '@store/stream/models';
import { EntryDetail, IconDiv, NoPaddingTd } from './styleComponents';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoABadge } from '@abgov/react-components/experimental';

interface SubscriberRolesProps {
  roles: string[];
  publicSubscribe: boolean;
}

const SubscriberRoles = ({ roles, publicSubscribe }: SubscriberRolesProps): JSX.Element => {
  return (
    <td>
      {publicSubscribe ? (
        <GoABadge key={`roles-public`} type="information" content={'Public'} />
      ) : (
        roles &&
        roles.map((role): JSX.Element => {
          return <GoABadge key={`roles-${role}`} type="information" content={role} />;
        })
      )}
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
        <td data-testid={`stream-name`}>{stream?.name}</td>
        <SubscriberRoles roles={stream?.subscriberRoles} publicSubscribe={stream.publicSubscribe} />
        <td>
          <IconDiv>
            <GoAContextMenu>
              <GoAContextMenuIcon
                type={showStream ? 'eye-off' : 'eye'}
                onClick={() => setShowStream(!showStream)}
                testId={`toggle-stream-visibility`}
              />
              {isTenantSpecificStream ? (
                <>
                  <GoAContextMenuIcon type="create" onClick={() => onEdit(stream.id)} testId="edit-stream" />
                  <GoAContextMenuIcon type="trash" onClick={() => onDelete(stream.id)} testId="delete-stream" />
                </>
              ) : (
                ''
              )}
            </GoAContextMenu>
          </IconDiv>
        </td>
      </tr>
      {showStream && (
        <tr>
          <NoPaddingTd colSpan={3}>
            <EntryDetail data-testid={`stream-details`}>{JSON.stringify(stream, null, 2)}</EntryDetail>
          </NoPaddingTd>
        </tr>
      )}
    </>
  );
};
