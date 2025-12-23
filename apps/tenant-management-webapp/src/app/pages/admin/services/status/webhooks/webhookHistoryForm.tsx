import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EventLogEntry, EventSearchCriteria } from '@store/event/models';
import { selectWebhookInHistory, selectInitHistoryWebhookCriteria } from '@store/status/selectors';

import DataTable from '@components/DataTable';
import { getEventLogEntries, clearEventLogEntries } from '@store/event/actions';
import { getEventDefinitions } from '@store/event/actions';
import { LoadMoreWrapper } from '@components/styled-components';
import { GoabBadge, GoabButton, GoabInput, GoabButtonGroup, GoabFormItem, GoabModal } from '@abgov/react-components';
import styled from 'styled-components';

import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';
import { HoverWrapper, ToolTip } from '../styled-components';
import { ResetModalState } from '@store/session/actions';
import {
  GoabTextAreaOnKeyPressDetail,
  GoabInputOnChangeDetail,
  GoabDropdownOnChangeDetail,
} from '@abgov/ui-components-common';

interface EventLogEntryComponentProps {
  entry: EventLogEntry;
}

const statusBadge = (value: string) => {
  return (
    <PaddingRight>
      <GoabBadge
        key="webhook-status-badge"
        content={value === 'OK' ? 'Success' : 'Failure'}
        data-testid="webhook-status-badge"
        type={value === 'OK' ? 'success' : 'emergency'}
        icon={false}
      />
    </PaddingRight>
  );
};

function ordinal_suffix_of(i) {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) {
    return i + 'st';
  }
  if (j === 2 && k !== 12) {
    return i + 'nd';
  }
  if (j === 3 && k !== 13) {
    return i + 'rd';
  }
  return i + 'th';
}

const EventLogEntryComponent = ({ entry }: EventLogEntryComponentProps): JSX.Element => {
  const dateArray = entry.timestamp.toDateString().split(' ');
  const date = dateArray[1] + ' ' + ordinal_suffix_of(dateArray[2]);

  const objectLength = 14;
  const url = entry.details.URL || (entry.details?.webhook as Record<string, unknown>)?.url;
  const name = entry.details?.name || (entry.details?.webhook as Record<string, unknown>)?.name;

  const HoverOnShort = ({ displayString }) => {
    const [isShow, setIsShow] = useState<boolean>(false);
    return (
      <HoverWrapper
        onMouseEnter={() => {
          if (displayString.length >= objectLength) setIsShow(true);
        }}
        onMouseLeave={() => {
          setIsShow(false);
        }}
      >
        <div>
          {displayString.length >= objectLength ? `${displayString.substring(0, objectLength)}...` : displayString}
        </div>
        {isShow && (
          <ToolTip>
            <p className="url-tooltip">
              <div className="message">{displayString}</div>
            </p>
          </ToolTip>
        )}
      </HoverWrapper>
    );
  };

  return (
    <AlignedTr>
      <td headers="name" className="padding-left-8">
        <HoverOnShort displayString={name} />
      </td>
      <td headers="url">
        <HoverOnShort displayString={url} />
      </td>
      <td headers="status">
        <StatusView>
          {statusBadge((entry.details?.response as Record<string, unknown>).status as string)}
          {(entry.details?.response as Record<string, unknown>).status as string}
        </StatusView>
      </td>
      <td headers="timestamp">
        <span>{date}</span>
        <span> </span>
        <span>{entry.timestamp.toLocaleTimeString()}</span>
      </td>
    </AlignedTr>
  );
};

export const WebhookHistoryModal = (): JSX.Element => {
  const dispatch = useDispatch();
  const webhook = useSelector(selectWebhookInHistory);
  const [searched, setSearched] = useState(false);
  const initSearchCriteria = useSelector(selectInitHistoryWebhookCriteria);
  const [searchCriteria, setSearchCriteria] = useState(initSearchCriteria);
  const next = useSelector((state: RootState) => state.event.nextEntries);
  const isLoading = useSelector((state: RootState) => state.event.isLoading.log);
  const today = new Date().toLocaleDateString().split('/').reverse().join('-');
  const entries = useSelector((state: RootState) => state.event.entries);

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  // eslint-disable-next-line
  useEffect(() => {}, [entries, next]);

  const onSearch = (criteria: EventSearchCriteria) => {
    dispatch(clearEventLogEntries());
    dispatch(getEventLogEntries('', criteria));
    setSearched(true);
  };

  const onNext = () => {
    searched ? dispatch(getEventLogEntries(next, searchCriteria)) : dispatch(getEventLogEntries(next));
  };

  useEffect(() => {
    setSearchCriteria(initSearchCriteria);

    if (webhook !== undefined) {
      onSearch(initSearchCriteria);
    }
  }, [webhook]); // eslint-disable-line react-hooks/exhaustive-deps

  if (searchCriteria === undefined) return null;

  return (
    <GoabModalStyle>
      <GoabModal
        testId="webhook-history-modal"
        heading="Webhook History"
        open={webhook !== undefined}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              type="secondary"
              onClick={() => {
                dispatch(ResetModalState());
              }}
            >
              Close
            </GoabButton>
            <GoabButton
              type="primary"
              onClick={() => {
                onSearch(searchCriteria);
              }}
            >
              Search
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <GoabFormItem label="Application">
          <div className="grey-fill">{webhook?.targetId}</div>
        </GoabFormItem>

        <GoabFormItem label="URL">
          <GoabInput
            name="url"
            type="url"
            width="100%"
            testId="webhook-history-url-input"
            value={searchCriteria?.url || webhook?.url}
            onChange={(detail: GoabInputOnChangeDetail) => {
              setSearchCriteria({ ...searchCriteria, url: detail.value });
            }}
            aria-label="description"
          />
        </GoabFormItem>
        <DateFilter>
          <StartDate>
            <GoabFormItem label="Start date">
              <DateTimeInput
                type="datetime-local"
                name="timestampMin"
                max={today}
                aria-label="timestampMin"
                value={searchCriteria?.timestampMin}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, timestampMin: e.target.value })}
              />
            </GoabFormItem>
          </StartDate>
          <EndDate>
            <GoabFormItem label="End date">
              <DateTimeInput
                type="datetime-local"
                name="timestampMax"
                max={today}
                aria-label="timestampMax"
                value={searchCriteria?.timestampMax}
                onChange={(e) => setSearchCriteria({ ...searchCriteria, timestampMax: e.target.value })}
              />
            </GoabFormItem>
          </EndDate>
        </DateFilter>

        {searched && (
          <div className="mt-1 mb-2px">
            {entries ? (
              entries?.length > 0 ? (
                <DataTable>
                  <colgroup>
                    <col className="data-col" />
                    <col className="data-col" />
                    <col className="data-col" />
                    <col className="data-col" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th id="name">Name</th>
                      <th id="url">URL</th>
                      <th id="status">Status</th>
                      <th id="timestamp">Occurred</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries !== null &&
                      entries.map((entry) => (
                        <EventLogEntryComponent
                          key={`${entry.timestamp}${entry.namespace}${entry.name}`}
                          entry={entry}
                        />
                      ))}
                  </tbody>
                </DataTable>
              ) : (
                'No webhook history found'
              )
            ) : (
              <PageIndicator />
            )}
            {next && (
              <div className="mt-1">
                <LoadMoreWrapper>
                  <GoabButton
                    type="tertiary"
                    testId="webhook-history-form-load-more"
                    disabled={isLoading}
                    onClick={onNext}
                  >
                    Load more
                  </GoabButton>
                </LoadMoreWrapper>
              </div>
            )}
          </div>
        )}
      </GoabModal>
    </GoabModalStyle>
  );
};

const GoabModalStyle = styled.div`
  max-width: 640px;
  .group-name {
    font-size: var(--goa-font-size-5);
    font-weight: var(--fw-bold);
  }

  .grey-fill {
    background: #dcdcdc;
    padding: 8px;
    border: 1px solid F1F1F1;
    border-radius: 4px;
  }

  .mt-1 {
    margin-top: 1rem;
  }

  .mb-2px {
    margin-bottom: 2px;
  }

  .goa-scrollable {
    margin-bottom: 0;
  }

  .modal-container {
    max-width: 640px;
  }
`;

const DateTimeInput = styled.input`
  display: flex;
  align-content: center;
  line-height: var(--input-height);
  height: var(--input-height);
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  > input {
    border: none;
  }
  :hover {
    border-color: var(--color-blue-600);
  }
  :active,
  :focus {
    border-color: #004f84;
    box-shadow: 0 0 0 3px #feba35;
    outline: none;
  }
`;

const DateFilter = styled.div`
  display: flex;
`;
const StatusView = styled.div`
  display: flex;
`;
const StartDate = styled.div`
  margin-right: 24px;
`;
const EndDate = styled.div`
  display: flex;
`;

const PaddingRight = styled.div`
  margin: 0 10px 0 0;
`;

const AlignedTr = styled.tr`
  vertical-align: top;

  .padding-left-8 {
    padding-left: 8px;
  }
`;
