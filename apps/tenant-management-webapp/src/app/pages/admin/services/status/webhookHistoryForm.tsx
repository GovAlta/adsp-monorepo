import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EventLogEntry, EventSearchCriteria } from '@store/event/models';
import { Webhooks } from '../../../../store/status/models';
import DataTable from '@components/DataTable';
import { getEventLogEntries, clearEventLogEntries } from '@store/event/actions';
import { GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { getEventDefinitions } from '@store/event/actions';

import { GoABadge } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import { GoAButton } from '@abgov/react-components/experimental';

import {
  GoAForm,
  GoAFormItem,
  GoAInput,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';

import { RootState } from '../../../../store/index';

interface Props {
  onCancel: () => void;
  webhook: Webhooks;
}

interface EventLogEntryComponentProps {
  entry: EventLogEntry;
  onSearchRelated: (correlationId: string) => void;
}

const statusBadge = (value: string) => {
  return (
    <PaddingLeftRight>
      <GoABadge
        key="webhook-status-badge"
        content={value === 'OK' ? 'Success' : 'Failure'}
        data-testid="webhook-status-badge"
        type={value === 'OK' ? 'success' : 'emergency'}
      />
    </PaddingLeftRight>
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

const EventLogEntryComponent: FunctionComponent<EventLogEntryComponentProps> = ({
  entry,
  onSearchRelated,
}: EventLogEntryComponentProps) => {
  const dateArray = entry.timestamp.toDateString().split(' ');
  const date = dateArray[1] + ' ' + ordinal_suffix_of(dateArray[2]);

  return (
    <>
      <tr>
        <td headers="name">{entry.details?.name?.toString()}</td>
        <td headers="url">{entry.details.URL as string}</td>
        <td headers="status">
          <StatusView>
            {statusBadge(entry.details?.callStatus as string)}
            {entry.details?.callStatusCode as string}
          </StatusView>
        </td>
        <td headers="timestamp">
          <span>{date}</span>
          <span> </span>
          <span>{entry.timestamp.toLocaleTimeString()}</span>
        </td>
      </tr>
    </>
  );
};

export const WebhookHistoryModal: FunctionComponent<Props> = ({ onCancel, webhook }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const [viewWebhooks, setViewWebhooks] = useState(false);
  const [searched, setSearched] = useState(false);
  const initCriteria: EventSearchCriteria = {
    name: 'webhook-triggered',
    namespace: 'push-service',
    timestampMax: '',
    timestampMin: '',
    url: webhook.url,
    applications: webhook.targetId,
    value: webhook.targetId,
  };

  const [searchCriteria, setSearchCriteria] = useState(initCriteria);
  const next = useSelector((state: RootState) => state.event.nextEntries);
  const isLoading = useSelector((state: RootState) => state.event.isLoading.log);
  const today = new Date().toLocaleDateString().split('/').reverse().join('-');

  const { applications } = useSelector((state: RootState) => state.serviceStatus);

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  const onSearch = (criteria: EventSearchCriteria) => {
    dispatch(clearEventLogEntries());
    dispatch(getEventLogEntries('', criteria));
    setSearched(true);
    setSearchCriteria(criteria);
    setViewWebhooks(true);
  };

  const onNext = () => {
    searched ? dispatch(getEventLogEntries(next, searchCriteria)) : dispatch(getEventLogEntries(next));
  };

  const entries = useSelector((state: RootState) => state.event.entries);

  return (
    <GoAModalStyle>
      <GoAModal isOpen={true} testId="webhook-history-modal">
        <GoAModalTitle>Webhook History</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <div style={{ height: '1000px' }}>
              <GoAFormItem>
                <label>Application</label>
                <GoADropdown
                  name="Application"
                  selectedValues={[searchCriteria.applications]}
                  onChange={(_n, [value]) =>
                    setSearchCriteria({ ...searchCriteria, applications: value, value: value })
                  }
                  multiSelect={false}
                >
                  {applications.map((application): JSX.Element => {
                    return (
                      <GoADropdownOption
                        label={application.appKey}
                        value={application.appKey}
                        key={application.appKey}
                        visible={true}
                      />
                    );
                  })}
                </GoADropdown>
              </GoAFormItem>

              <GoAFormItem>
                <label>URL</label>
                <GoAInput
                  name="url"
                  type="text"
                  value={searchCriteria.url}
                  onChange={(name, value) => {
                    setSearchCriteria({ ...searchCriteria, url: value });
                  }}
                  aria-label="description"
                />
              </GoAFormItem>
              <DateFilter>
                <StartDate>
                  <GoAFormItem>
                    <label>Start date</label>
                    <DateTimeInput
                      type="datetime-local"
                      name="timestampMin"
                      max={today}
                      aria-label="timestampMin"
                      value={searchCriteria.timestampMin}
                      onChange={(e) => setSearchCriteria({ ...searchCriteria, timestampMin: e.target.value })}
                    />
                  </GoAFormItem>
                </StartDate>
                <EndDate>
                  <GoAFormItem>
                    <label>End date</label>
                    <DateTimeInput
                      type="datetime-local"
                      name="timestampMax"
                      max={today}
                      aria-label="timestampMax"
                      value={searchCriteria.timestampMax}
                      onChange={(e) => setSearchCriteria({ ...searchCriteria, timestampMax: e.target.value })}
                    />
                  </GoAFormItem>
                </EndDate>
              </DateFilter>

              <SearchButtonPadding>
                <GoAButton
                  type={'secondary'}
                  onClick={() => {
                    onSearch(searchCriteria);
                  }}
                >
                  Show
                </GoAButton>
              </SearchButtonPadding>
              {viewWebhooks && (
                <GoAFormItem>
                  {entries?.length > 0 ? (
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
                              onSearchRelated={(correlationId) => onSearch({ correlationId })}
                            />
                          ))}
                      </tbody>
                    </DataTable>
                  ) : (
                    'No webhook history found'
                  )}
                  {next && (
                    <GoAButton disabled={isLoading} onClick={onNext}>
                      Load more...
                    </GoAButton>
                  )}
                </GoAFormItem>
              )}
            </div>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton
            buttonType="secondary"
            onClick={() => {
              setViewWebhooks(false);
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </GoAModalStyle>
  );
};

const GoAModalStyle = styled.div`
  .group-name {
    font-size: var(--fs-lg);
    font-weight: var(--fw-bold);
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

const SearchButtonPadding = styled.div`
  margin: 10px 0 15px 0;
`;

const PaddingLeftRight = styled.div`
  margin: 0 10px 0 10px;
`;
