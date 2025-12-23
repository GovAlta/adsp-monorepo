import { Main } from '@components/Html';
import { RootState } from '@store/index';
import { getEventLogEntries, clearEventLogEntries } from '@store/event/actions';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EventLogEntries } from './eventLogEntries';
import { EventSearchForm } from './eventSearchForm';
import { GoabButton, GoabCallout } from '@abgov/react-components';

import { EventSearchCriteria } from '@store/event/models';
import { LoadMoreWrapper } from '@components/styled-components';
import { ServiceColumnLayout } from '../../admin';

export const EventLog: FunctionComponent = () => {
  const readerRole = 'value-reader';
  const hasReaderRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:value-service']?.roles?.includes(readerRole)
  );
  const [searched, setSearched] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState(null);
  const next = useSelector((state: RootState) => state.event.nextEntries);
  const isLoading = useSelector((state: RootState) => state.event.isLoading.log);
  const dispatch = useDispatch();

  useEffect(() => {
    if (hasReaderRole) {
      dispatch(getEventLogEntries());
    }
  }, [dispatch, hasReaderRole]);

  useEffect(() => {
    return function clean() {
      dispatch(clearEventLogEntries());
    };
  }, [dispatch]);

  const onSearch = (criteria: EventSearchCriteria) => {
    if (hasReaderRole) {
      dispatch(clearEventLogEntries());
      dispatch(getEventLogEntries('', criteria));
      setSearched(true);
      setSearchCriteria(criteria);
    }
  };
  const onSearchCancel = () => {
    setSearched(false);
    dispatch(getEventLogEntries());
  };
  const onNext = () => {
    searched ? dispatch(getEventLogEntries(next, searchCriteria)) : dispatch(getEventLogEntries(next));
  };
  return (
    <Main>
      <ServiceColumnLayout>
        <h1 data-testid="eventLog-title">Event log</h1>
        <p>
          The event log shows the sequence of events for your tenant. Enable the adsp-event-listener in your realm to
          include access events. Send domain events via the event service to include your own events in the log.
        </p>
        <section>
          {hasReaderRole ? (
            <>
              <EventSearchForm onSearch={(criteria) => onSearch(criteria)} onCancel={onSearchCancel} />
              <br />
              <EventLogEntries onSearch={onSearch} />
              {next && (
                <LoadMoreWrapper>
                  <GoabButton disabled={isLoading} type="tertiary" onClick={onNext}>
                    Load more
                  </GoabButton>
                </LoadMoreWrapper>
              )}
            </>
          ) : (
            <GoabCallout heading="Value reader role required" type="information" testId="role-need-callout">
              <p>You need the urn:ads:platform:value-service 'value-reader' role to see the event log.</p>
            </GoabCallout>
          )}
        </section>
      </ServiceColumnLayout>
    </Main>
  );
};
