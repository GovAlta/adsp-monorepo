import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { TableDiv } from '../styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { deleteSharepointConnection } from '@store/sharePoint/actions';
import { MarginTop } from '../styled-components';

interface connectionTableProps {
  connectionSite: string;
  connectionList: string;
  connectionName: string;
  showDeleteConfig: (show: boolean) => void;
}

export const DeleteConfirmationsView: FunctionComponent<connectionTableProps> = ({
  connectionSite,
  connectionList,
  connectionName,
  showDeleteConfig,
}) => {
  const dispatch = useDispatch();

  return (
    <TableDiv key="connection">
      <DeleteModal
        title="Delete connection"
        isOpen={true}
        onCancel={() => {
          showDeleteConfig(false);
        }}
        content={
          <div>
            Are you sure you want to delete this connection?
            <MarginTop>
              <b>Site ID</b>: {connectionSite}
              <p>
                <b>List ID:</b> {connectionList}
              </p>
            </MarginTop>
          </div>
        }
        onDelete={() => {
          showDeleteConfig(false);
          dispatch(deleteSharepointConnection(connectionName));
        }}
      />
      <br />
    </TableDiv>
  );
};
