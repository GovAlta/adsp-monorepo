import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { ValueDefinition } from '@store/value/models';
import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { renderNoItem } from '@components/NoItem';
import { Dispatch } from '@jsonforms/react';
import { ValueDefinitionsList } from './definitionsList';

interface ValueDefinitionsComponentProps {
  className?: string;
}

export const ValueDefinitions: FunctionComponent<ValueDefinitionsComponentProps> = ({ className }) => {
  const definitions = useSelector((state: RootState) =>
    state.valueService.results.map((r) => state.valueService.definitions[r])
  );

  const tenantDefinitions = definitions.filter((d) => !d.isCore);
  const coreDefinitions = definitions.filter((d) => d.isCore);

  return (
    <div>
      {tenantDefinitions && <ValueDefinitionsList definitions={tenantDefinitions} className={className} />}
      {coreDefinitions && (
        <div>
          <h2>Core configuration</h2>
          <ValueDefinitionsList definitions={coreDefinitions} className={className} />
        </div>
      )}
    </div>
  );
};
