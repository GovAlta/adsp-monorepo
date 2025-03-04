import { DataObject, NestedItem, RenderCellColumnProps } from './ObjectListControlTypes';
import { GoAIcon } from '@abgov/react-components';
import { HilightCellWarning, ObjectArrayWarningIconDiv } from './styled-components';
import { isEmpty } from 'lodash';
import { ErrorObject } from 'ajv';

export const extractNestedFields = (properties: DataObject, propertyKeys: string[]): Record<string, NestedItem> => {
  const nestedItems: Record<string, NestedItem> = {};

  propertyKeys.forEach((key) => {
    if (properties[key].type === 'array') {
      const propItems = (properties[key] && properties[key].items?.properties) || [];
      const propReqItems = (properties[key].items && properties[key].items?.required) || [];
      nestedItems[key] = {
        properties: [...Object.keys(propItems)],
        required: [...Object.keys(propReqItems)],
      };
    }
  });

  return nestedItems;
};

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

export const isObjectArrayEmpty = (currentData: string) => {
  const result = isEmpty(currentData) || JSON.stringify(currentData) === '[{}]';
  return result;
};

export const renderCellColumn = ({
  currentData,
  error,
  errors,
  index,
  rowPath,
  element,
  isRequired,
}: RenderCellColumnProps) => {
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

  if ((currentData === undefined && isRequired) || (error !== '' && error !== undefined)) {
    return renderWarningCell(currentData);
  } else if (currentData !== undefined && isRequired && error) {
    return renderWarningCell(currentData);
  }

  const path = `/${rowPath}/${index}/${element}/${index === 0 ? index : index - 1}`;
  const nestedErrors = errors?.filter((e: ErrorObject) => e.instancePath.includes(path));

  /* istanbul ignore next */
  if (typeof currentData === 'string') {
    return currentData;
  } else if (typeof currentData === 'object' || Array.isArray(currentData)) {
    const result = Object.keys(currentData);

    if (!isRequired && nestedErrors.length === 0) {
      return <pre>{JSON.stringify(currentData, null, 2)}</pre>;
    } else if (result.length === 0) {
      return renderWarningCell();
    } else if (result.length > 0 && (isObjectArrayEmpty(currentData) || nestedErrors.length > 0)) {
      return <pre>{renderWarningCell(JSON.stringify(currentData, null, 2))}</pre>;
    } else if (currentData !== undefined && result.length > 0 && error !== '' && error !== undefined) {
      const values = Object.values(currentData) as string[];
      if (values && values.length > 0) {
        return <pre>{renderWarningCell(JSON.stringify(values.at(0), null, 2))}</pre>;
      }
    } else {
      return <pre>{JSON.stringify(currentData, null, 2)}</pre>;
    }
  }

  return null;
};
