import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import { GoAButton } from '@abgov/react-components';
import type { EventDefinition } from '@store/event/models';
import styled from 'styled-components';

interface EventDefinitionProps {
  definition: EventDefinition;
  readonly?: boolean;
}

const EventDefinitionComponent: FunctionComponent<EventDefinitionProps> = ({ definition }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr>
        <td headers="namespace" data-testid="namespace">
          {definition.namespace}
        </td>
        <td headers="name" data-testid="name">
          {definition.name}
        </td>
        <td headers="description" data-testid="description">
          {definition.description}
        </td>
        <td headers="payload" data-testid="payload">
          <GoAButton buttonType="secondary" onClick={() => setShowDetails(!showDetails)} data-testid="toggle-details-visibility">
            {showDetails ? 'Hide details' : 'Show details'}
          </GoAButton>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td className="payload-details" headers="namespace name description payload" colSpan={5}>
            <div>{JSON.stringify(definition.payloadSchema, null, 2)}</div>
          </td>
        </tr>
      )}
    </>
  );
};

interface EventDefinitionsListComponentProps {
  className?: string;
}

export const EventDefinitionsListComponent: FunctionComponent<EventDefinitionsListComponentProps> = ({ className }) => {
  const definitions = useSelector((state: RootState) => state.event.results.map((r) => state.event.definitions[r]));
  return (
    <DataTable className={className} data-testid="events-definitions-table">
      <thead>
        <tr>
          <th id="namespace">Namespace</th>
          <th id="name">Name</th>
          <th id="description">Description</th>
          <th id="payload">Payload</th>
        </tr>
      </thead>
      <tbody>
        {definitions.map((definition) => (
          <EventDefinitionComponent key={`${definition.namespace}:${definition.name}`} definition={definition} />
        ))}
      </tbody>
    </DataTable>
  );
};

export const EventDefinitionsList = styled(EventDefinitionsListComponent)`
  & .payload-details {
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
`;
