import React, { FunctionComponent, useEffect, useState } from 'react';

import DataTable from '@components/DataTable';

import type { ValueDefinition } from '@store/value/models';

import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';

import { EntryDetail, TableDiv } from '../styled-components';

interface ValueDefinitionProps {
  definition: ValueDefinition;
  readonly?: boolean;
  onDelete: (definition: ValueDefinition) => void;
  onEdit: (definition: ValueDefinition) => void;
}

export const ValueComponent: FunctionComponent<ValueDefinitionProps> = ({ definition, onDelete, onEdit }) => {
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
            <EntryDetail data-testid="value-schema-details">
              {JSON.stringify(definition.jsonSchema, null, 2)}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};

interface ValueDefinitionsComponentProps {
  definitions: ValueDefinition[];
  onDelete: (def: ValueDefinition) => void;
  onEdit: (def: ValueDefinition) => void;
}

export const ValueDefinitionsList: FunctionComponent<ValueDefinitionsComponentProps> = ({
  definitions,
  onDelete,
  onEdit,
}) => {
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
    <div>
      {orderedGroupNames.map((group) => (
        <TableDiv key={group}>
          <div className="group-name">{group}</div>
          <DataTable data-testid="values-definitions-table">
            <thead data-testid="values-definitions-table-header">
              <tr>
                <th id="name" data-testid="values-definitions-table-header-name">
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
                  <ValueComponent
                    key={`${definition.namespace}:${definition.name}}`}
                    definition={definition}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
            </tbody>
          </DataTable>
        </TableDiv>
      ))}
    </div>
  );
};
