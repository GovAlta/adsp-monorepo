import { RenderCellColumnProps } from './ObjectListControlTypes';
import { GoAIcon } from '@abgov/react-components';
import { HilightCellWarning, ObjectArrayWarningIconDiv } from './styled-components';

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

export const renderCellColumn = ({ currentData, error, isRequired }: RenderCellColumnProps) => {
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

  if (typeof currentData === 'string') {
    return currentData;
  } else if (typeof currentData === 'object' || Array.isArray(currentData)) {
    console.log('currentData', JSON.stringify(currentData, null, 2));
    const result = Object.keys(currentData);
    if (result.length === 0) {
      return renderWarningCell();
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
