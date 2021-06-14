import { GoAButton } from '@abgov/react-components';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { getEventLogEntries } from '@store/event-log/actions';
import { EventLogEntry } from '@store/event-log/models';
import React, { FunctionComponent, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

interface EventLogEntryComponentProps {
  entry: EventLogEntry;
}

const EventLogEntryComponent: FunctionComponent<EventLogEntryComponentProps> = ({
  entry,
}: EventLogEntryComponentProps) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr>
        <td>
          <span>{entry.timestamp.toLocaleDateString()}</span>
          <span>{entry.timestamp.toLocaleTimeString()}</span>
        </td>
        <td>{entry.namespace}</td>
        <td>{entry.name}</td>
        <td>
          <GoAButton onClick={() => setShowDetails(!showDetails)}>Show details</GoAButton>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td colSpan={4}>
            <div className="event-details">{JSON.stringify(entry.details, null, 2)}</div>
          </td>
        </tr>
      )}
    </>
  );
};

interface EventLogEntriesComponentProps {
  className?: string;
}

const EventLogEntriesComponent: FunctionComponent<EventLogEntriesComponentProps> = ({ className }) => {
  const entries = useSelector((state: RootState) => state.eventLog.entries);
  const next = useSelector((state: RootState) => state.eventLog.next);
  const dispatch = useDispatch();

  return (
    <div className={className}>
      <DataTable>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Namespace</th>
            <th>Name</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <EventLogEntryComponent key={`${entry.timestamp}${entry.namespace}${entry.name}`} entry={entry} />
          ))}
        </tbody>
      </DataTable>
      {next && <GoAButton onClick={() => dispatch(getEventLogEntries(next))}>Load more</GoAButton>}
    </div>
  );
};

export const EventLogEntries = styled(EventLogEntriesComponent)`
  & .event-details {
    background: #f3f3f3;
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 12px;
    line-height: 16px;
    padding: 8px;
  }
  & span {
    margin-right: 8px;
  }
`;
