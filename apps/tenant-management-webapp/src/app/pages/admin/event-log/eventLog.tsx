import { Main } from '@components/Html';
import { RootState } from '@store/index';
import { getEventLogPage, clearEventLogEntries } from '@store/event/actions';
import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EventLogEntries } from './eventLogEntries';
import { EventSearchForm } from './eventSearchForm';
import { GoabButton, GoabCallout } from '@abgov/react-components';

import { EventSearchCriteria, DEFAULT_EVENT_LOG_PAGE_SIZE } from '@store/event/models';
import { ServiceColumnLayoutWithMargin } from '../../admin';
import { exportEventLogEntries, isExportCanceled } from './exportEventLog';
import { EventLogExportModal } from './eventLogExportModal';
import { EventLogPagination } from './eventLogPagination';
import { SmallButton } from './styled-components';
import { defaultEventLogCriteria } from './util';
import { ErrorNotification } from '@store/notifications/actions';

export const EventLog: FunctionComponent = () => {
  const readerRole = 'value-reader';
  const hasReaderRole = useSelector((state: RootState) =>
    state.session?.resourceAccess?.['urn:ads:platform:value-service']?.roles?.includes(readerRole),
  );
  const [initialCriteria] = useState(defaultEventLogCriteria);
  const [searchCriteria, setSearchCriteria] = useState<EventSearchCriteria>(initialCriteria);
  // Clearing the date filter must not display pagination's pinned cutoff as a Custom filter.
  const [pageCriteria, setPageCriteria] = useState<EventSearchCriteria>(initialCriteria);
  const [pageSize, setPageSize] = useState(DEFAULT_EVENT_LOG_PAGE_SIZE);
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
    (criteria: EventSearchCriteria, size: number) => {
      // Pin the upper bound so newly logged events do not shift page offsets or the total while paging.
      const pinnedCriteria = { ...criteria, timestampMax: criteria.timestampMax || new Date().toISOString() };
      setSearchCriteria(criteria);
      setPageCriteria(pinnedCriteria);
      dispatch(clearEventLogEntries());
      dispatch(getEventLogPage(1, size, pinnedCriteria, true));
    },
    [dispatch],
  );

  useEffect(() => {
    if (hasReaderRole) {
      search(initialCriteria, DEFAULT_EVENT_LOG_PAGE_SIZE);
    }
  }, [search, hasReaderRole, initialCriteria]);

  useEffect(() => {
    return function clean() {
      exportAbortRef.current?.abort();
      dispatch(clearEventLogEntries());
    };
  }, [dispatch]);

  const onSearch = (criteria: EventSearchCriteria) => {
    if (hasReaderRole) {
      search(
        {
          ...criteria,
          timestampMin: criteria.timestampMin ?? searchCriteria.timestampMin,
          timestampMax: criteria.timestampMax ?? searchCriteria.timestampMax,
        },
        pageSize,
      );
    }
  };
  const onPage = (page: number) => {
    dispatch(getEventLogPage(page, pageSize, pageCriteria));
  };
  const onPageSize = (size: number) => {
    setPageSize(size);
    // The total is unchanged, so only the first page at the new size is needed.
    dispatch(getEventLogPage(1, size, pageCriteria));
  };
  const hasSelectedEvent = Boolean(searchCriteria?.namespace || searchCriteria?.name);
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
      const fileName = [searchCriteria.namespace, searchCriteria.name].filter(Boolean).join('-');
      const count = await exportEventLogEntries(valueServiceApiUrl, token, fileName, pageCriteria, controller.signal);
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
                initialValue={searchCriteria}
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
                  pageSize={logPage.pageSize}
                  shownCount={entries?.length ?? 0}
                  total={logPage.total}
                  onPage={onPage}
                  onPageSize={onPageSize}
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
