import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EventLogEntry, EventSearchCriteria } from '@store/event/models';
import { Webhooks } from '../../../../store/status/models';
import DataTable from '@components/DataTable';
import { getEventLogEntries, clearEventLogEntries } from '@store/event/actions';
import { getEventDefinitions } from '@store/event/actions';

import { GoABadge, GoAButton } from '@abgov/react-components-new';
import styled from 'styled-components';
import { GoAPageLoader } from '@abgov/react-components';

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
import { HoverWrapper, ToolTip } from './styled-components';

interface Props {
  onCancel: () => void;
  webhook: Webhooks;
}

interface EventLogEntryComponentProps {
  entry: EventLogEntry;
}

const statusBadge = (value: string) => {
  return (
    <PaddingRight>
      <GoABadge
        key="webhook-status-badge"
        content={value === 'OK' ? 'Success' : 'Failure'}
        data-testid="webhook-status-badge"
        type={value === 'OK' ? 'success' : 'emergency'}
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

const EventLogEntryComponent: FunctionComponent<EventLogEntryComponentProps> = ({
  entry,
}: EventLogEntryComponentProps) => {
  const dateArray = entry.timestamp.toDateString().split(' ');
  const date = dateArray[1] + ' ' + ordinal_suffix_of(dateArray[2]);

  const objectLength = 14;
  const url = entry.details.URL as string;
  const name = entry.details?.name?.toString();

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
    <>
      <AlignedTr>
        <td headers="name" className="padding-left-8">
          <HoverOnShort displayString={name} />
        </td>
        <td headers="url">
          <HoverOnShort displayString={url} />
        </td>
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
      </AlignedTr>
    </>
  );
};

export const WebhookHistoryModal: FunctionComponent<Props> = ({ onCancel, webhook }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

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

  useEffect(() => {
    dispatch(getEventDefinitions());
    onSearch(searchCriteria);
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
            <GoAWrapper>
              <GoAFormItem>
                <label>Application</label>
                <div className="grey-fill">{searchCriteria.applications}</div>
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

              {viewWebhooks && (
                <div className="mt-1 mb-2px">
                  <>
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
                      <LoadingWrapper>
                        <GoAPageLoader visible={true} type="infinite" message={indicator.message} pagelock={true} />
                      </LoadingWrapper>
                    )}
                    {next && (
                      <div className="mt-1">
                        <GoAButton
                          type="tertiary"
                          testId="webhook-history-form-load-more"
                          disabled={isLoading}
                          onClick={onNext}
                        >
                          Load more...
                        </GoAButton>
                      </div>
                    )}
                  </>
                </div>
              )}
            </GoAWrapper>
          </GoAForm>
        </GoAModalContent>
        <GoAModalActions>
          <ButtonPadding>
            <ButtonWrapper>
              <GoAButton
                type="primary"
                onClick={() => {
                  setViewWebhooks(false);
                  onCancel();
                }}
              >
                Close
              </GoAButton>
            </ButtonWrapper>
            <ButtonWrapper>
              <GoAButton
                type="secondary"
                onClick={() => {
                  onSearch(searchCriteria);
                }}
              >
                Search
              </GoAButton>
            </ButtonWrapper>
          </ButtonPadding>
        </GoAModalActions>
      </GoAModal>
    </GoAModalStyle>
  );
};

const GoAWrapper = styled.div`
  width: 584px;
`;

const GoAModalStyle = styled.div`
  max-width: 640px;
  .group-name {
    font-size: var(--fs-lg);
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

const ButtonPadding = styled.div`
  display: flex;
  flex-direction: row-reverse;
`;

const ButtonWrapper = styled.div`
  margin-left: 24px;
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

const LoadingWrapper = styled.div`
  margin: 30px 0 30px 0;
`;
