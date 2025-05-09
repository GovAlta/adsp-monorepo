import React, { useState } from 'react';
import { Stream } from '@store/stream/models';
import { IconDiv, NoPaddingTd } from './styleComponents';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoABadge } from '@abgov/react-components';
import { EntryDetail } from '../../styled-components';

interface SubscriberRolesProps {
  roles?: string[];
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
                title="Toggle details"
                onClick={() => setShowStream(!showStream)}
                testId={`toggle-stream-visibility`}
              />
              {isTenantSpecificStream ? (
                <>
                  <GoAContextMenuIcon
                    type="create"
                    title="Edit"
                    onClick={() => onEdit(stream.id)}
                    testId="edit-stream"
                  />
                  <GoAContextMenuIcon
                    type="trash"
                    title="Delete"
                    onClick={() => onDelete(stream.id)}
                    testId="delete-stream"
                  />
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
