import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoabButton } from '@abgov/react-components';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { RootState } from '@store/index';
import { fetchSharepointConfiguration, updateSharepointConnection } from '@store/sharePoint/actions';
import { ButtonPadding, TabIntro } from '../styled-components';
import { ConnectionModal } from './connectionModal';
import { ConnectionTableComponent } from './connectionTable';
import { DeleteConfirmationsView } from './deleteConfirmationsView';

export const ConnectionsView = (): JSX.Element => {
  const dispatch = useDispatch();
  const [editId, setEditId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);
  const { connections, destinations } = useSelector((state: RootState) => state.sharepoint);

  useEffect(() => {
    dispatch(fetchSharepointConfiguration());
  }, [dispatch]);

  const closeModal = () => {
    setIsAdding(false);
    setEditId(null);
  };

  return (
    <section>
      <TabIntro>
        A connection is how ADSP signs in to one SharePoint site: your team's app registration (Entra tenant ID, client
        ID and secret) and the site it can write to. Add a destination to say which list on that site data goes to.
      </TabIntro>
      <ButtonPadding>
        <GoabButton size="compact" testId="add-connection-btn" onClick={() => setIsAdding(true)}>
          Add connection
        </GoabButton>
      </ButtonPadding>

      {indicator?.show && <PageIndicator />}
      {!indicator?.show && Object.keys(connections).length === 0 && renderNoItem('sharepoint connection')}
      {Object.keys(connections).length > 0 && (
        <ConnectionTableComponent
          connections={connections}
          onEdit={(connection) => setEditId(connection.id)}
          onDelete={(connection) => setDeleteId(connection.id)}
        />
      )}

      {(isAdding || editId) && (
        <ConnectionModal
          open={true}
          connectionId={editId || undefined}
          onCancel={closeModal}
          onSave={(connection, clientSecret) => dispatch(updateSharepointConnection(connection, clientSecret))}
        />
      )}
      {deleteId && connections[deleteId] && (
        <DeleteConfirmationsView
          connection={connections[deleteId]}
          destinationNames={Object.values(destinations)
            .filter((destination) => destination.connectionId === deleteId)
            .map((destination) => destination.name)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </section>
  );
};
