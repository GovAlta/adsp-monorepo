import React, { FunctionComponent, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveWebhook } from '../../../../store/status/actions';
import { EventLogEntry, EventSearchCriteria } from '@store/event/models';
import { Webhooks } from '../../../../store/status/models';
import DataTable from '@components/DataTable';
import { getEventLogEntries, clearEventLogEntries } from '@store/event/actions';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { GoACheckbox, GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { getEventDefinitions } from '@store/event/actions';
import { useValidators } from '@lib/validation/useValidators';
import { renderNoItem } from '@components/NoItem';
import { GoABadge } from '@abgov/react-components/experimental';
import styled from 'styled-components';
import { GoAButton } from '@abgov/react-components/experimental';

import {
  characterCheck,
  validationPattern,
  isNotEmptyCheck,
  Validator,
  wordMaxLengthCheck,
} from '@lib/validation/checkInput';

import {
  GoAForm,
  GoAFormItem,
  GoAInput,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';

import { GoATextArea } from '@abgov/react-components-new';
import { RootState } from '../../../../store/index';
import { createSelector } from 'reselect';
import { DropdownListContainer, DropdownList } from './styled-components';
import { Application } from 'express-serve-static-core';
interface CorrelationIndicatorProps {
  color: string;
}

const IndicatorDiv = styled.div`
  width: 12px;
  height: 12px;
  background: ${(props) => props.color};
  border-radius: 100%;
`;
const CorrelationIndicator: FunctionComponent<CorrelationIndicatorProps> = ({ color }) => {
  return color && <IndicatorDiv color={color} />;
};

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
  const [showDetails, setShowDetails] = useState(false);

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
      {showDetails && (
        <tr>
          <td headers="correlation timestamp namespace name details" colSpan={5} className="event-details">
            <div>{JSON.stringify(entry.details, null, 2)}</div>
          </td>
        </tr>
      )}
    </>
  );
};

export const WebhookHistoryModal: FunctionComponent<Props> = ({ onCancel, webhook }: Props): JSX.Element => {
  const dispatch = useDispatch();
  //const [webhook, setWebhook] = useState<Webhooks>({ ...defaultWebhooks });

  const [selectedApplications, setSelectedApplications] = useState();
  const [open, setOpen] = useState(false);
  const [viewWebhooks, setViewWebhooks] = useState(false);
  const [selectedUrl, setSelectedURL] = useState('');
  const [timeStampMin, setTimeStampMin] = useState('');
  const [timeStampMax, setTimeStampMax] = useState('');
  const [searched, setSearched] = useState(false);
  const [colors, setColors] = useState({});
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

  const { directory } = useSelector((state: RootState) => state.directory);
  const { webhooks } = useSelector((state: RootState) => state.serviceStatus);
  const { applications } = useSelector((state: RootState) => state.serviceStatus);
  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  const { errors, validators } = useValidators(
    'nameAppKey',
    'name',
    checkForBadChars,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('nameAppKey')
  )
    .add('nameOnly', 'name', checkForBadChars)
    .add(
      'url',
      'url',
      wordMaxLengthCheck(150, 'URL'),
      characterCheck(validationPattern.validURL),
      isNotEmptyCheck('url')
    )
    .build();

  useEffect(() => {
    if (directory.length === 0) {
      //dispatch(fetchDirectory());
    }
  }, []);

  const onSearch = (criteria: EventSearchCriteria) => {
    dispatch(clearEventLogEntries());
    dispatch(getEventLogEntries('', criteria));
    setSearched(true);
    setSearchCriteria(criteria);
    setViewWebhooks(true);
  };
  const onSearchCancel = () => {
    setSearched(false);
    dispatch(getEventLogEntries());
  };
  const onNext = () => {
    searched ? dispatch(getEventLogEntries(next, searchCriteria)) : dispatch(getEventLogEntries(next));
  };

  const entries = useSelector((state: RootState) => state.event.entries);

  const filtedByApplicationEntries = entries?.filter((entry) => entry.details.targetId === searchCriteria.applications);

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

              <GoAFormItem error={errors?.['description']}>
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
                      onClick={() => setOpen(false)}
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
                      onClick={() => setOpen(false)}
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
              if (onCancel) onCancel();
              // setWebhook({ ...defaultWebhooks });
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
