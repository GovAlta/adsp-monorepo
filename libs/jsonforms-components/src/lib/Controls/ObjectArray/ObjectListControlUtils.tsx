import React, { ReactNode } from 'react';
import { GoabTable } from '@abgov/react-components';
import { DataObject, NestedItem, RenderCellColumnProps } from './ObjectListControlTypes';
import { GoabIcon } from '@abgov/react-components';
import { HilightCellWarning, ObjectArrayWarningIconDiv } from './styled-components';
import { isEmpty } from 'lodash';
import { ErrorObject } from 'ajv';
import { NoneGivenTableText } from '../Inputs/style-component';

const jsonPreviewStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  whiteSpace: 'pre-wrap',
  textAlign: 'left',
  overflowX: 'auto',
};

export const extractNestedFields = (properties: DataObject, propertyKeys: string[]): Record<string, NestedItem> => {
  const nestedItems: Record<string, NestedItem> = {};

  propertyKeys.forEach((key) => {
    if (properties[key].type === 'array') {
      const propItems = (properties[key] && properties[key].items?.properties) || [];
      const propReqItems = (properties[key].items && (properties[key].items?.required as unknown as string[])) || [];
      nestedItems[key] = {
        properties: [...Object.keys(propItems)],
        required: [...propReqItems],
      };
    }
  });

  return nestedItems;
};

function prettify(prop: string): string {
  return prop
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

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
      const key = parts[parts.length - 1];

      if (typeof typedObj.label === 'string' && typedObj.label.trim()) {
        names[key] = typedObj.label;
      } else if (
        typeof typedObj.label === 'object' &&
        typedObj.label !== null &&
        'text' in (typedObj.label as Record<string, unknown>) &&
        typeof (typedObj.label as Record<string, unknown>).text === 'string' &&
        ((typedObj.label as Record<string, unknown>).text as string).trim()
      ) {
        names[key] = (typedObj.label as Record<string, unknown>).text as string;
      } else {
        names[key] = prettify(key);
      }
    }

    Object.values(typedObj).forEach((value) => extractNames(value, names));
  }

  return names;
};

function getHeaderLabel(
  headName: string,
  itemsSchema: Record<string, unknown>,
  columnLabels?: Record<string, string>,
): string {
  if (columnLabels?.[headName]) {
    return columnLabels[headName];
  }

  const fieldSchema = itemsSchema?.[headName] as Record<string, unknown> | undefined;
  if (fieldSchema && typeof fieldSchema.title === 'string' && fieldSchema.title.trim()) {
    return fieldSchema.title;
  }

  return prettify(headName);
}

export interface TableProps {
  itemsSchema: Record<string, unknown>;
  data: Record<string, unknown>[];
  columnLabels?: Record<string, string>;
}

const DataTable = ({ itemsSchema, data, columnLabels }: TableProps): JSX.Element => {
  return (
    <GoabTable width="100%">
      <thead>
        <tr>
          {itemsSchema &&
            Object.keys(itemsSchema)?.map((headNames, ix) => {
              return <th key={ix}>{getHeaderLabel(headNames, itemsSchema, columnLabels)}</th>;
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
    </GoabTable>
  );
};

export const isObjectArrayEmpty = (currentData: string) => {
  const result = isEmpty(currentData) || JSON.stringify(currentData) === '[{}]';
  return result;
};

export const renderNoneGivenText = (data: string | undefined) => {
  return !data ? (
    <>
      <NoneGivenTableText>(none given)</NoneGivenTableText>
      <br />
    </>
  ) : (
    data
  );
};

export const renderCellColumn = ({
  data,
  error,
  errors,
  index,
  rowPath,
  element,
  isRequired,
}: RenderCellColumnProps) => {
  const renderWarningCell = (error?: string) => {
    return (
      <HilightCellWarning>
        {renderNoneGivenText(data)}
        <ObjectArrayWarningIconDiv>
          <GoabIcon type="warning" title="warning" size="small" theme="filled" ml="2xs" mt="2xs"></GoabIcon>
          {error ? error : ''}
        </ObjectArrayWarningIconDiv>
      </HilightCellWarning>
    );
  };

  if ((data === undefined && isRequired) || (error !== '' && error !== undefined)) {
    const message = error || (isRequired && data === undefined ? 'Required' : data);
    return renderWarningCell(message);
  } else if (data !== undefined && isRequired && error) {
    return renderWarningCell(error);
  }

  const path = `/${rowPath}/${index}/${element}/${index === 0 ? index : index - 1}`;
  const nestedErrors = errors?.filter((e: ErrorObject) => e.instancePath.includes(path));

  /* istanbul ignore next */
  if (typeof data === 'boolean') {
    return data ? 'Yes' : 'No';
  } else if (typeof data === 'number') {
    return String(data);
  } else if (typeof data === 'string') {
    return data;
  } else if (typeof data === 'object' || Array.isArray(data)) {
    const result = Object.keys(data);

    if (!isRequired && nestedErrors.length === 0) {
      if (
        'year' in (data as Record<string, unknown>) &&
        'month' in (data as Record<string, unknown>) &&
        ('day' in (data as Record<string, unknown>) || 'date' in (data as Record<string, unknown>))
      ) {
        const dateObj = data as { year: unknown; month: unknown; day?: unknown; date?: unknown };
        const dayValue = 'day' in dateObj ? dateObj.day : dateObj.date;
        return `${dateObj.year}-${dateObj.month}-${dayValue}`;
      }
      return <pre style={jsonPreviewStyle}>{JSON.stringify(data, null, 2)}</pre>;
    } else if (result.length === 0) {
      return renderWarningCell();
    } else if (result.length > 0 && (isObjectArrayEmpty(data) || nestedErrors.length > 0)) {
      return <pre style={jsonPreviewStyle}>{renderWarningCell(JSON.stringify(data, null, 2))}</pre>;
    } else if (data !== undefined && result.length > 0 && error !== '' && error !== undefined) {
      const values = Object.values(data) as string[];
      if (values && values.length > 0) {
        return <pre style={jsonPreviewStyle}>{renderWarningCell(JSON.stringify(values.at(0), null, 2))}</pre>;
      }
    } else {
      const firstRow = Array.isArray(data) ? data[0] : undefined;
      const columnLabels = extractNames(firstRow);

      return <DataTable itemsSchema={data[0]} data={data} columnLabels={columnLabels} />;
    }
  }

  return null;
};
