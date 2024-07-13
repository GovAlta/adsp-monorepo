import { useContext } from 'react';
import React from 'react';
import { JsonFormContext } from '../../../Context';
import { Categorization, Category, ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { renderReviewControl } from './renderReviewControl';
import { renderReviewListWithDetail } from './renderReviewLIstWithDetail';

interface RenderFormReviewFieldsProps {
  elements: UISchemaElement[] | (Category | Categorization)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  requiredFields: string[];
  schema: JsonSchema;
}

const isControl = (type: string): boolean => {
  return type === 'Control';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isListWithDetail = (type: string, data: any, fieldName: string): boolean => {
  return (
    type === 'ListWithDetail' &&
    typeof data === 'object' &&
    data !== null &&
    fieldName in data &&
    Array.isArray(data[fieldName]) &&
    data[fieldName].length > 0
  );
};

const isLayout = (schema: unknown): boolean => {
  return typeof schema === 'object' && schema !== null && 'elements' in schema;
};

export const RenderFormReviewFields: React.FC<RenderFormReviewFieldsProps> = ({
  elements,
  data,
  requiredFields,
  schema,
}) => {
  const enumerators = useContext(JsonFormContext);
  const downloadTriggerFunction = enumerators?.functions?.get('download-file');
  const downloadTrigger = downloadTriggerFunction && downloadTriggerFunction();
  const fileListValue = enumerators?.data?.get('file-list');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileList = fileListValue && (fileListValue() as Record<string, any>);

  const downloadFile = (file: File, propertyId: string) => {
    if (downloadTrigger) {
      downloadTrigger(file, propertyId);
    }
  };

  return elements.map((element, index) => {
    const clonedElement = JSON.parse(JSON.stringify(element));
    const fieldName: string = clonedElement.scope?.split('/').pop();

    if (isControl(clonedElement.type)) {
      return renderReviewControl(schema, data, clonedElement, requiredFields, index, fileList, downloadFile);
    } else if (isListWithDetail(clonedElement.type, data, fieldName)) {
      const elements = removeLayouts(clonedElement?.options?.detail?.elements) || [];
      return renderReviewListWithDetail(schema, elements, data, fieldName, index, requiredFields);
    } else if (isLayout(clonedElement)) {
      return (
        <React.Fragment key={index}>
          <RenderFormReviewFields
            elements={clonedElement.elements}
            data={data}
            requiredFields={requiredFields}
            schema={schema}
          />
        </React.Fragment>
      );
    }
    return null;
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const removeLayouts = (elements: any[]): any[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    elements &&
    elements.reduce((acc, item) => {
      if (isLayout(item)) {
        return acc.concat(removeLayouts(item.elements));
      } else {
        return acc.concat(item);
      }
    }, [])
  );
};
