import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { ValueDefinition } from '@store/value/models';
import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { renderNoItem } from '@components/NoItem';
import { Dispatch } from '@jsonforms/react';

interface ValueDefinitionProps {
  definition: ValueDefinition;
  readonly?: boolean;
}

export const ValueComponent: FunctionComponent<ValueDefinitionProps> = ({ definition }) => {
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
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td className="payload-details" headers="namespace name description payload" colSpan={5}>
            <div data-testid="details">{JSON.stringify(definition.jsonSchema, null, 2)}</div>
          </td>
        </tr>
      )}
    </>
  );
};

interface ValueDefinitionsComponentProps {
  definitions: ValueDefinition[];
  className: string;
}

const ValueDefinitionsListComponent: FunctionComponent<ValueDefinitionsComponentProps> = ({
  definitions,
  className,
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
    <div className={className}>
      {(orderedGroupNames.length === 0 || !orderedGroupNames) && renderNoItem('value definition')}
      {orderedGroupNames.map((group) => (
        <div key={group}>
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

export const ValueDefinitionsList = styled(ValueDefinitionsListComponent)`
  display: flex-inline-table;
  & .group-name {
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
