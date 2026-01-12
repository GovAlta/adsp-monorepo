import React, { useEffect, useState } from 'react';
import { RootState } from '@store/index';
import { deleteEventStream, fetchEventStreams, updateEventStream } from '@store/stream/actions';
import { useDispatch, useSelector } from 'react-redux';
import { StreamTable } from './streamTable';
import { CORE_TENANT } from '@store/tenant/models';
import { PageIndicator } from '@components/Indicator';
import { FetchRealmRoles } from '@store/tenant/actions';
import { AddEditStream } from './addEditStream/addEditStream';
import { GoabButton } from '@abgov/react-components';
import { initialStream } from '@store/stream/models';
import { DeleteModal } from '@components/DeleteModal';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { UpdateModalState } from '@store/session/actions';
import { AddModalType, EditModalType } from '@store/stream/models';
import { selectTenantStreams } from '@store/stream/selectors';

export const EventStreams = (): JSX.Element => {
  const dispatch = useDispatch();

  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const tenantStreams = useSelector(selectTenantStreams);
  const coreStreams = useSelector((state: RootState) => state.stream?.core);
  const eventDefinitions = useSelector((state: RootState) => state.event.definitions);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const [showDeleteStream, setShowDeleteStream] = useState(false);

  const [selectedStream, setSelectedStream] = useState(initialStream);
  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
    dispatch(fetchEventStreams());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line
  useEffect(() => {}, [tenantStreams]);

  return (
    <section>
      <PageIndicator />
      {!indicator.show && (
        <>
          <GoabButton
            testId="add-stream"
            onClick={() => {
              dispatch(
                UpdateModalState({
                  type: AddModalType,
                  id: null,
                  isOpen: true,
                })
              );
            }}
          >
            Add stream
          </GoabButton>
          <br />
          <br />

          <AddEditStream
            streams={tenantStreams}
            eventDefinitions={eventDefinitions}
            onSave={(stream) => {
              dispatch(updateEventStream(stream));
            }}
          />

          <div>
            <StreamTable
              isTenantSpecificStream={true}
              key={tenantName}
              onDelete={(streamId) => {
                setSelectedStream(tenantStreams[streamId]);
                setShowDeleteStream(true);
              }}
              onEdit={(streamId) => {
                dispatch(
                  UpdateModalState({
                    type: EditModalType,
                    id: streamId,
                    isOpen: true,
                  })
                );
              }}
              streams={{ ...tenantStreams }}
              namespace={tenantName}
            />
          </div>
          <div>
            <h2>Core streams</h2>
            <StreamTable
              isTenantSpecificStream={false}
              key={CORE_TENANT}
              streams={coreStreams}
              namespace={CORE_TENANT}
            />
          </div>
          {/* Delete confirmation */}

          <DeleteModal
            isOpen={showDeleteStream}
            title="Delete stream"
            content={
              <div>
                Are you sure you wish to delete <b> {selectedStream.name}</b>?
              </div>
            }
            onCancel={() => {
              setShowDeleteStream(false);
            }}
            onDelete={() => {
              setShowDeleteStream(false);
              dispatch(dispatch(deleteEventStream(selectedStream.id)));
            }}
          />
        </>
      )}
    </section>
  );
};
