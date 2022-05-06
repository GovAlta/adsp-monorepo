import React, { useEffect } from 'react';
import { RootState } from '@store/index';
import { fetchCoreStreams, fetchTenantStreams } from '@store/stream/actions';
import { useDispatch, useSelector } from 'react-redux';
import { StreamTable } from './streamTable';
import { CORE_TENANT } from '@store/tenant/models';
import { NameDiv } from './styleComponents';
import { getEventDefinitions } from '@store/event/actions';

export const EventStreams = (): JSX.Element => {
  const dispatch = useDispatch();

  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const tenantStreams = useSelector((state: RootState) => state.stream?.tenant);
  const coreStreams = useSelector((state: RootState) => state.stream?.core);
  const events = useSelector((state: RootState) => state.event.definitions);

  useEffect(() => {
    if (!events) {
      dispatch(getEventDefinitions());
    }
  }, []);

  useEffect(() => {}, [events]);
  useEffect(() => {
    dispatch(fetchCoreStreams());
    dispatch(fetchTenantStreams());
  }, []);

  return (
    <>
      {tenantName !== CORE_TENANT && (
        <div>
          <NameDiv>{tenantName}</NameDiv>
          <StreamTable streams={tenantStreams} namespace={CORE_TENANT} isCore={false} />
        </div>
      )}
      <div>
        <NameDiv>{CORE_TENANT}</NameDiv>
        <StreamTable streams={coreStreams} namespace={CORE_TENANT} isCore={true} />
      </div>
    </>
  );
};
