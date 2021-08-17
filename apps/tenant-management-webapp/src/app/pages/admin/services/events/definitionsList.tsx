import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { EventDefinition } from '@store/event/models';
import styled from 'styled-components';

import EyeOpen from '@assets/icons/eye-outline.svg';
import EyeClosed from '@assets/icons/eye-off-outline.svg';
import Edit from '@assets/icons/create-outline.svg';
import Trash from '@assets/icons/trash-outline.svg';

interface EventDefinitionProps {
  definition: EventDefinition;
  readonly?: boolean;
  onEdit: (definition: EventDefinition) => void;

  onDelete: (definition: EventDefinition) => void;
}

const EventDefinitionComponent: FunctionComponent<EventDefinitionProps> = ({ definition, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr>
        <td headers="name" data-testid="name">
          {definition.name}
        </td>
        <td headers="description" data-testid="description">
          {definition.description}
        </td>
        <td headers="payload" data-testid="payload">
          <ActionMenu>
            <ActionItem onClick={() => setShowDetails(!showDetails)} data-testid="toggle-details-visibility">
              {showDetails ? (
                <img src={EyeClosed} width="20" alt="Hide details" />
              ) : (
                <img src={EyeOpen} width="20" alt="Show details" />
              )}
            </ActionItem>

            {!definition.isCore && (
              <ActionItem onClick={() => onEdit(definition)} data-testid="edit-details">
                <img src={Edit} width="20" alt="Edit" />
              </ActionItem>
            )}

            {!definition.isCore && (
              <ActionItem onClick={() => onDelete(definition)} data-testid="delete-details">
                <img src={Trash} width="20" alt="Delete" />
              </ActionItem>
            )}
          </ActionMenu>
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

// This is a simplified form of the components/ContextMenu. A simple styled component is less complex and easier to use.
// TODO: replace the usage of components/ContextMenu with this.
const ActionItem = styled.div``;

const ActionMenu = styled.div`
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #fff;

  > div {
    display: flex;
    align-items: center;
    cursor: pointer;
    border-radius: 0.25rem;
    padding: 0.25rem;

    &:hover {
      background: var(--color-gray-200);
    }
  }
  > div + div {
    margin-left: 0rem;
  }
`;

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

  return (
    <div className={className}>
      {Object.keys(groupedDefinitions).map((group) => (
        <div key={group}>
          <div className="group-name">{group}</div>
          <DataTable data-testid="events-definitions-table">
            <thead>
              <tr>
                <th id="name">Name</th>
                <th id="description">Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groupedDefinitions[group].map((definition) => (
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
    text-transform: capitalize;
    font-size: var(--fs-lg);
    font-weight: var(--fw-bold);
  }

  & td:first-child {
    width: 100px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
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
