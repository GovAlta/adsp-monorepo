import { GoAButton } from '@abgov/react-components';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { EventLogEntry } from '@store/event/models';
import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
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
        <td headers="timestamp">
          <span>{entry.timestamp.toLocaleDateString()}</span>
          <span>{entry.timestamp.toLocaleTimeString()}</span>
        </td>
        <td headers="namespace">{entry.namespace}</td>
        <td headers="name">{entry.name}</td>
        <td headers="details">
          <GoAButton buttonType="secondary" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide details' : 'Show details'}
          </GoAButton>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td headers="timestamp namespace name details" colSpan={4} className="event-details">
            <div>{JSON.stringify(entry.details, null, 2)}</div>
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
  const entries = useSelector((state: RootState) => state.event.entries);

  return (
    <div className={className}>
      <DataTable>
        <thead>
          <tr>
            <th id="timestamp">Timestamp</th>
            <th id="namespace">Namespace</th>
            <th id="name">Name</th>
            <th id="details">Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <EventLogEntryComponent key={`${entry.timestamp}${entry.namespace}${entry.name}`} entry={entry} />
          ))}
        </tbody>
      </DataTable>
    </div>
  );
};

export const EventLogEntries = styled(EventLogEntriesComponent)`
  & .event-details {
    div {
      background: #f3f3f3;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      line-height: 16px;
      padding: 16px;
    }
    padding: 0;
  }
  & span {
    margin-right: 8px;
  }
`;
