import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { EventDefinition } from '@store/event/models';
import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { renderNoItem } from '@components/NoItem';

interface EventDefinitionProps {
  definition: EventDefinition;
  readonly?: boolean;
  onEdit: (definition: EventDefinition) => void;
  onDelete: (definition: EventDefinition) => void;
}

const EventDefinitionComponent: FunctionComponent<EventDefinitionProps> = ({ definition, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  return (
    <>
      <tr>
        <td headers="name" data-testid="name">
          {definition.name}
        </td>
        <td headers="description" data-testid="description">
          {definition.description}
        </td>
        <td headers="actions" data-testid="actions">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showDetails ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => setShowDetails(!showDetails)}
              testId="toggle-details-visibility"
            />
            {!definition.isCore && (
              <GoAContextMenuIcon type="create" title="Edit" onClick={() => onEdit(definition)} testId="edit-details" />
            )}
            {!definition.isCore && (
              <GoAContextMenuIcon
                type="trash"
                title="Delete"
                onClick={() => onDelete(definition)}
                testId="delete-details"
              />
            )}
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td className="payload-details" headers="namespace name description payload" colSpan={5}>
            <div data-testid="details">{JSON.stringify(definition.payloadSchema, null, 2)}</div>
          </td>
        </tr>
      )}
    </>
  );
};

interface EventDefinitionsListComponentProps {
  className?: string;
  onEdit: (def: EventDefinition) => void;
  onDelete: (def: EventDefinition) => void;
}

const EventDefinitionsListComponent: FunctionComponent<EventDefinitionsListComponentProps> = ({
  className,
  onEdit,
  onDelete,
}) => {
  const definitions = useSelector((state: RootState) => state.event.results.map((r) => state.event.definitions[r]));

  const groupedDefinitions = definitions.reduce((acc, def) => {
    acc[def.namespace] = acc[def.namespace] || [];
    acc[def.namespace].push(def);
    return acc;
  }, {});
  const orderedGroupNames = Object.keys(groupedDefinitions).sort((prev, next): number => {
    // Each group must have at least one element
    if (groupedDefinitions[prev][0].isCore > groupedDefinitions[next][0].isCore) {
      return 1;
    }
    if (prev > next) {
      return 1;
    }
    return -1;
  });

  return (
    <div className={className}>
      {!orderedGroupNames && renderNoItem('event definition')}
      {orderedGroupNames.map((group) => (
        <div key={group}>
          <div className="group-name">{group}</div>
          <DataTable data-testid="events-definitions-table">
            <thead data-testid="events-definitions-table-header">
              <tr>
                <th id="name" data-testid="events-definitions-table-header-name">
                  Name
                </th>
                <th id="description">Description</th>
                <th id="actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {groupedDefinitions[group]
                .sort((a, b) => (a.name < b.name ? -1 : 1))
                .map((definition) => (
                  <EventDefinitionComponent
                    onEdit={onEdit}
                    onDelete={onDelete}
                    key={`${definition.namespace}:${definition.name}:${Math.random()}`}
                    definition={definition}
                  />
                ))}
            </tbody>
          </DataTable>
        </div>
      ))}
    </div>
  );
};

export const EventDefinitionsList = styled(EventDefinitionsListComponent)`
  display: flex-inline-table;
  & .group-name {
    font-size: var(--goa-font-size-5);
    font-weight: var(--fw-bold);
  }

  & td:first-child {
    width: 35%;
    word-wrap: break-word;
    word-break: break-all;
  }

  & td:nth-child(2) {
    flex: 1;
    word-wrap: break-word;
    word-break: break-all;
  }

  & td:last-child {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

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

  table {
    margin-bottom: 2rem;
  }
`;
