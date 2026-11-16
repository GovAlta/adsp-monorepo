import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoabButton } from '@abgov/react-components';
import { DeleteModal } from '@components/DeleteModal';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { RootState } from '@store/index';
import {
  deleteSharepointDestination,
  fetchSharepointConfiguration,
  updateSharepointDestination,
} from '@store/sharePoint/actions';
import { ButtonPadding, TabIntro } from '../styled-components';
import { DestinationModal } from './destinationModal';
import { DestinationTableComponent } from './destinationTable';
import { TestDestinationModal } from './testDestinationModal';

export const DestinationsView = (): JSX.Element => {
  const dispatch = useDispatch();
  const indicator = useSelector((state: RootState) => state?.session?.indicator);
  const { connections, destinations } = useSelector((state: RootState) => state.sharepoint);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const hasConnections = Object.keys(connections).length > 0;

  useEffect(() => {
    dispatch(fetchSharepointConfiguration());
  }, [dispatch]);

  return (
    <section>
      <TabIntro>
        A destination is where data lands: one list on a connection's site, plus how fields in the data map to the
        list's columns. Form definitions pick a destination on their Lifecycle tab. Use Test to write a sample row
        before any real submissions arrive.
      </TabIntro>
      <ButtonPadding>
        <GoabButton
          size="compact"
          testId="add-destination-btn"
          disabled={!hasConnections}
          onClick={() => setIsAdding(true)}
        >
          Add destination
        </GoabButton>
        {!hasConnections && <p>Add a connection first.</p>}
      </ButtonPadding>

      {indicator?.show && <PageIndicator />}
      {!indicator?.show && Object.keys(destinations).length === 0 && renderNoItem('sharepoint destination')}
      {Object.keys(destinations).length > 0 && (
        <DestinationTableComponent
          destinations={destinations}
          connections={connections}
          onTest={(destination) => setTestId(destination.id)}
          onEdit={(destination) => setEditId(destination.id)}
          onDelete={(destination) => setDeleteId(destination.id)}
        />
      )}

      {(isAdding || editId) && (
        <DestinationModal
          destinationId={editId || undefined}
          onCancel={() => {
            setIsAdding(false);
            setEditId(null);
          }}
          onSave={(destination) => dispatch(updateSharepointDestination(destination))}
        />
      )}
      {testId && destinations[testId] && (
        <TestDestinationModal destination={destinations[testId]} onClose={() => setTestId(null)} />
      )}
      {deleteId && destinations[deleteId] && (
        <DeleteModal
          title="Delete destination"
          isOpen={true}
          onCancel={() => setDeleteId(null)}
          content={
            <div>
              Are you sure you want to delete <b>{destinations[deleteId].name}</b>? Forms that use it stop pushing to
              SharePoint.
            </div>
          }
          onDelete={() => {
            setDeleteId(null);
            dispatch(deleteSharepointDestination(deleteId));
          }}
        />
      )}
    </section>
  );
};
