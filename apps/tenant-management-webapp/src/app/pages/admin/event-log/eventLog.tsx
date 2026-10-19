import { Main } from '@components/Html';
import { RootState } from '@store/index';
import { getEventLogPage, clearEventLogEntries } from '@store/event/actions';
import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EventLogEntries } from './eventLogEntries';
import { EventSearchForm } from './eventSearchForm';
import { GoabButton, GoabCallout } from '@abgov/react-components';

import { EventSearchCriteria, EVENT_LOG_PAGE_SIZE } from '@store/event/models';
import { ServiceColumnLayoutWithMargin } from '../../admin';
import { exportEventLogEntries, isExportCanceled } from './exportEventLog';
import { EventLogExportModal } from './eventLogExportModal';
import { EventLogPagination } from './eventLogPagination';
import { SmallButton } from './styled-components';
import { ErrorNotification } from '@store/notifications/actions';

export const EventLog: FunctionComponent = () => {
  const readerRole = 'value-reader';
  const hasReaderRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:value-service']?.roles?.includes(readerRole),
  );
  const [searchCriteria, setSearchCriteria] = useState<EventSearchCriteria>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportRowCount, setExportRowCount] = useState(0);
  const exportAbortRef = useRef<AbortController | null>(null);
  const logPage = useSelector((state: RootState) => state.event.logPage);
  const entries = useSelector((state: RootState) => state.event.entries);
  const isLoading = useSelector((state: RootState) => state.event.isLoading.log);
  const valueServiceApiUrl = useSelector((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token = useSelector((state: RootState) => state.session?.credentials?.token);
  const dispatch = useDispatch();

  const search = useCallback(
    (criteria: EventSearchCriteria) => {
      // Pin the upper bound so newly logged events do not shift page offsets or the total while paging.
      const pinnedCriteria = { ...criteria, timestampMax: criteria.timestampMax || new Date().toISOString() };
      setSearchCriteria(pinnedCriteria);
      dispatch(clearEventLogEntries());
      dispatch(getEventLogPage(1, pinnedCriteria, true));
    },
    [dispatch],
  );

  useEffect(() => {
    if (hasReaderRole) {
      search({});
    }
  }, [search, hasReaderRole]);

  useEffect(() => {
    return function clean() {
      exportAbortRef.current?.abort();
      dispatch(clearEventLogEntries());
    };
  }, [dispatch]);

  const onSearch = (criteria: EventSearchCriteria) => {
    if (hasReaderRole) {
      search(criteria);
    }
  };
  const onSearchCancel = () => {
    search({});
  };
  const onPage = (page: number) => {
    dispatch(getEventLogPage(page, searchCriteria));
  };
  const hasSelectedEvent = Boolean(searchCriteria?.namespace && searchCriteria?.name);
  const hasEntries = Boolean(entries?.length);
  const closeExportModal = () => {
    setExportOpen(false);
    setIsExporting(false);
    setExportRowCount(0);
  };
  const onCancelExport = () => {
    exportAbortRef.current?.abort();
    closeExportModal();
  };
  const onExport = async () => {
    if (!hasReaderRole || !hasSelectedEvent || !hasEntries || !valueServiceApiUrl || !token) {
      return;
    }
    const controller = new AbortController();
    exportAbortRef.current = controller;
    setIsExporting(true);
    setExportOpen(true);
    setExportRowCount(0);
    try {
      const fileName = `${searchCriteria.namespace}-${searchCriteria.name}`;
      const count = await exportEventLogEntries(
        valueServiceApiUrl,
        token,
        fileName,
        searchCriteria || {},
        controller.signal,
      );
      setExportRowCount(count);
    } catch (error) {
      if (isExportCanceled(error)) {
        return;
      }
      closeExportModal();
      dispatch(ErrorNotification({ message: 'Failed to export event log. Try narrowing your time range.', error }));
    } finally {
      setIsExporting(false);
      exportAbortRef.current = null;
    }
  };
  return (
    <Main>
      <ServiceColumnLayoutWithMargin>
        <h1 data-testid="eventLog-title">Event log</h1>
        <p>
          The event log shows the sequence of events for your tenant. Enable the adsp-event-listener in your realm to
          include access events. Send domain events via the event service to include your own events in the log.
        </p>
        <section>
          {hasReaderRole ? (
            <>
              <EventSearchForm
                disabled={isLoading}
                onSearch={(criteria) => onSearch(criteria)}
                onCancel={onSearchCancel}
                leftAction={
                  <SmallButton>
                    <GoabButton
                      size="compact"
                      type="tertiary"
                      disabled={isExporting || !hasSelectedEvent || !hasEntries}
                      onClick={onExport}
                      testId="export-event-log-csv"
                    >
                      Download CSV
                    </GoabButton>
                  </SmallButton>
                }
              />
              <EventLogExportModal
                open={exportOpen}
                isExporting={isExporting}
                rowCount={exportRowCount}
                onCancel={onCancelExport}
                onClose={closeExportModal}
              />
              <EventLogEntries onSearch={onSearch} />
              {logPage && (
                <EventLogPagination
                  page={logPage.page}
                  pageSize={EVENT_LOG_PAGE_SIZE}
                  shownCount={entries?.length ?? 0}
                  total={logPage.total}
                  onPage={onPage}
                />
              )}
            </>
          ) : (
            <GoabCallout heading="Value reader role required" type="information" testId="role-need-callout">
              <p>You need the urn:ads:platform:value-service 'value-reader' role to see the event log.</p>
            </GoabCallout>
          )}
        </section>
      </ServiceColumnLayoutWithMargin>
    </Main>
  );
};
