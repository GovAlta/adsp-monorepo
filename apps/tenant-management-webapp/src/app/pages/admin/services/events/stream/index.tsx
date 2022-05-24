import React, { useEffect, useState } from 'react';
import { RootState } from '@store/index';
import { deleteEventStream, fetchEventStreams, updateEventStream } from '@store/stream/actions';
import { useDispatch, useSelector } from 'react-redux';
import { StreamTable } from './streamTable';
import { CORE_TENANT } from '@store/tenant/models';
import { NameDiv } from './styleComponents';
import { PageIndicator } from '@components/Indicator';
import { FetchRealmRoles } from '@store/tenant/actions';
import { AddEditStream } from './AddEditStream';
import { GoAButton } from '@abgov/react-components';
import { initialStream } from '@store/stream/models';
import { DeleteModal } from '@components/DeleteModal';

export const EventStreams = (): JSX.Element => {
  const dispatch = useDispatch();

  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const tenantStreams = useSelector((state: RootState) => state.stream?.tenant);
  const coreStreams = useSelector((state: RootState) => state.stream?.core);
  const realmRoles = useSelector((state: RootState) => state.tenant?.realmRoles);
  const eventDefinitions = useSelector((state: RootState) => state.event.definitions);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const [showDeleteStream, setShowDeleteStream] = useState(false);

  const [openAddStream, setOpenAddStream] = useState(false);
  const [selectedStream, setSelectedStream] = useState(initialStream);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    dispatch(fetchEventStreams());
    dispatch(FetchRealmRoles());
  }, []);

  const reset = () => {
    setIsEdit(false);
    setOpenAddStream(false);
    setSelectedStream(initialStream);
  };
  return (
    <>
      <PageIndicator />
      {!indicator.show && (
        <>
          <GoAButton
            data-testid="add-stream"
            onClick={() => {
              setOpenAddStream(true);
            }}
          >
            Add stream
          </GoAButton>
          <br />
          <br />
          {(isEdit || openAddStream) && (
            <AddEditStream
              streams={tenantStreams}
              open={openAddStream}
              isEdit={isEdit}
              onClose={reset}
              initialValue={selectedStream}
              realmRoles={realmRoles}
              eventDefinitions={eventDefinitions}
              onSave={(stream) => {
                dispatch(updateEventStream(stream));
              }}
            />
          )}
          <div>
            <StreamTable
              isTenantSpecificStream={true}
              key={tenantName}
              onDelete={(streamId) => {
                setSelectedStream(tenantStreams[streamId]);
                setShowDeleteStream(true);
              }}
              onEdit={(streamId) => {
                setSelectedStream(tenantStreams[streamId]);
                setIsEdit(true);
                setOpenAddStream(true);
              }}
              streams={tenantStreams}
              namespace={tenantName}
            />
          </div>
          <div>
            <NameDiv>Core streams</NameDiv>
            <StreamTable
              isTenantSpecificStream={false}
              key={CORE_TENANT}
              streams={coreStreams}
              namespace={CORE_TENANT}
            />
          </div>
          {/* Delete confirmation */}
          {showDeleteStream && (
            <DeleteModal
              isOpen={showDeleteStream}
              title="Delete stream"
              content={`Delete ${selectedStream.name}?`}
              onCancel={() => {
                setShowDeleteStream(false);
                reset();
              }}
              onDelete={() => {
                setShowDeleteStream(false);
                reset();
                dispatch(dispatch(deleteEventStream(selectedStream.id)));
              }}
            />
          )}
        </>
      )}
    </>
  );
};
