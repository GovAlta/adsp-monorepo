import React, { ReactNode } from 'react';
import { RenderCellColumnProps } from './ObjectListControlTypes';
import { GoAIcon } from '@abgov/react-components';
import { HilightCellWarning, ObjectArrayWarningIconDiv } from './styled-components';
import { GoATable } from '@abgov/react-components';

/**
 * Extract Json data schema name attribute and the ui schema label name.
 * @param obj
 * @param names
 * @returns A key value of the data attribute name and the uiSchema label value
 */
export const extractNames = (obj: unknown, names: Record<string, string> = {}): Record<string, string> => {
  if (Array.isArray(obj)) {
    obj.forEach((item) => extractNames(item, names));
  } else if (typeof obj === 'object' && obj !== null) {
    const typedObj = obj as Record<string, unknown>;

    if (typeof typedObj.scope === 'string') {
      const parts = typedObj.scope.split('/');
      if (typeof typedObj.label === 'string') {
        names[parts[parts.length - 1]] = typedObj.label;
      } else if (typeof typedObj.scope === 'string') {
        const parts = typedObj.scope.split('/');
        names[parts[parts.length - 1]] = parts[parts.length - 1];
      }
    }
    Object.values(typedObj).forEach((value) => extractNames(value, names));
  }

  return names;
};

export interface TableProps {
  itemsSchema: Record<string, unknown>;
  data: Record<string, unknown>[];
}

const DataTable = ({ itemsSchema, data }: TableProps): JSX.Element => {
  return (
    <GoATable width="100%">
      <thead>
        <tr>
          {itemsSchema &&
            Object.keys(itemsSchema)?.map((headNames, ix) => {
              return <th key={ix}>{headNames}</th>;
            })}
        </tr>
      </thead>
      <tbody>
        {(data as Record<string, unknown>[]).map((obj, index) => (
          <tr key={index}>
            {itemsSchema &&
              Object.keys(itemsSchema).map((headNames, ix) => {
                return <td key={ix}>{obj[headNames as keyof typeof obj] as ReactNode}</td>;
              })}
          </tr>
        ))}
      </tbody>
    </GoATable>
  );
};

export const renderCellColumn = ({ data, error, isRequired }: RenderCellColumnProps) => {
  const renderWarningCell = (data?: string) => {
    return (
      <HilightCellWarning>
        <ObjectArrayWarningIconDiv>
          <GoAIcon type="warning" title="warning" size="small" theme="filled" ml="2xs" mt="2xs"></GoAIcon>
          {data}
        </ObjectArrayWarningIconDiv>
      </HilightCellWarning>
    );
  };

  if ((data === undefined && isRequired) || (error !== '' && error !== undefined)) {
    return renderWarningCell(data);
  } else if (data !== undefined && isRequired && error) {
    return renderWarningCell(data);
  }

  if (typeof data === 'string') {
    return data;
  } else if (typeof data === 'object' || Array.isArray(data)) {
    const result = Object.keys(data);
    if (result.length === 0) {
      return renderWarningCell();
    } else if (data !== undefined && result.length > 0 && error !== '' && error !== undefined) {
      const values = Object.values(data) as string[];
      if (values && values.length > 0) {
        return <pre>{renderWarningCell(JSON.stringify(values.at(0), null, 2))}</pre>;
      }
    } else {
      return <DataTable itemsSchema={data[0]} data={data} />;
    }
  }

  return null;
};
