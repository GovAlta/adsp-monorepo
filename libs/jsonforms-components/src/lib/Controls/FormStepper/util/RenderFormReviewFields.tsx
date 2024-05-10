import { useContext } from 'react';
import React from 'react';
import { JsonFormContext } from '../../../Context';
import { Categorization, Category, UISchemaElement } from '@jsonforms/core';
import { renderReviewControl } from './renderReviewControl';
import { renderReviewListWithDetail } from './renderReviewLIstWithDetail';

interface RenderFormReviewFieldsProps {
  elements: UISchemaElement[] | (Category | Categorization)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  requiredFields: string[];
}

export const RenderFormReviewFields: React.FC<RenderFormReviewFieldsProps> = ({ elements, data, requiredFields }) => {
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

    if (clonedElement.type === 'Control' && clonedElement.scope) {
      return renderReviewControl(data, clonedElement, requiredFields, index, fileList, downloadFile);
    } else if (clonedElement.type !== 'ListWithDetail' && clonedElement?.elements) {
      return (
        <React.Fragment key={index}>
          <RenderFormReviewFields elements={clonedElement.elements} data={data} requiredFields={requiredFields} />
        </React.Fragment>
      );
    } else if (clonedElement.type === 'ListWithDetail' && data && data[fieldName] && data[fieldName].length > 0) {
      return renderReviewListWithDetail(clonedElement, data, fieldName, index, requiredFields);
    }
    return null;
  });
};
