import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoabButton } from '@abgov/react-components';
import { ConnectionModal } from './connectionModal';
import { ConnectionTableComponent } from './connectionTable';
import { DeleteConfirmationsView } from './deleteConfirmationsView';
import { fetchSharepointConnections, updateSharepointConnection } from '@store/sharePoint/actions';
import { ButtonPadding } from '../styled-components';
interface AddEditConnectionProps {
  activeEdit: boolean;
}
export const ConnectionsView = ({ activeEdit }: AddEditConnectionProps): JSX.Element => {
  const dispatch = useDispatch();
  const [openEditConnection, setOpenEditConnection] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | undefined>();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  useEffect(() => {
    dispatch(fetchSharepointConnections());
  }, [dispatch]);

  const { connections } = useSelector((state: RootState) => state.sharepoint);

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenEditConnection(true);
    }
  }, [activeEdit]);

  const reset = () => {
    setOpenEditConnection(false);
    setSelectedConnectionId('');
    document.body.style.overflow = 'unset';
  };

  const onEdit = (connection, tenantMode) => {
    setSelectedConnectionId(connection.id);
    setOpenEditConnection(true);
  };

  const onDelete = (connection) => {
    setSelectedConnectionId(connection.id);
    setShowDeleteConfirmation(true);
  };

  return (
    <section>
      <ButtonPadding>
        <GoabButton size="compact"
          testId="add-connection-btn"
          onClick={() => {
            setSelectedConnectionId(undefined);
            setOpenEditConnection(true);
          }}
        >
          Add connection
        </GoabButton>
      </ButtonPadding>

      {indicator && <PageIndicator />}
      {Object.keys(connections).length === 0 && renderNoItem('sharepoint connection')}
      {Object.keys(connections).length > 0 && (
        <div>
          <ConnectionTableComponent connections={connections} onEdit={onEdit} onDelete={onDelete} tenantMode={true} />
        </div>
      )}

      {openEditConnection && (
        <ConnectionModal
          open={openEditConnection}
          connectionId={selectedConnectionId}
          onCancel={() => {
            reset();
          }}
          onSave={(connection) => dispatch(updateSharepointConnection(connection))}
        />
      )}
      {showDeleteConfirmation && (
        <DeleteConfirmationsView
          connectionSite={connections[selectedConnectionId]?.siteId}
          connectionList={connections[selectedConnectionId]?.listId}
          connectionName={connections[selectedConnectionId]?.name}
          connectionId={selectedConnectionId}
          showDeleteConfig={(conf) => setShowDeleteConfirmation(conf)}
        ></DeleteConfirmationsView>
      )}
    </section>
  );
};
