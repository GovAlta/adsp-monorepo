import { useContext } from 'react';
import { Grid, GridItem } from '../../../common/Grid';
import React from 'react';
import { ListWithDetail, ListWithDetailHeading } from '../styled-components';
import { JsonFormContext } from '../../../Context';
import { getFormFieldValue, resolveLabelFromScope } from './GenerateFormFields';
import { Categorization, Category, UISchemaElement } from '@jsonforms/core';

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
    const lastSegment: string = clonedElement.scope?.split('/').pop();

    if (clonedElement.type === 'Control' && clonedElement.scope) {
      const label = clonedElement.label ? clonedElement.label : resolveLabelFromScope(clonedElement.scope);
      if (!label) return null;
      const isFileUploader = clonedElement.scope.includes('fileUploader');
      const fileUploaderElement = isFileUploader ? fileList && fileList[lastSegment] : null;
      const fieldValues = getFormFieldValue(clonedElement.scope, data ? data : {});
      const isRequired = requiredFields.includes(lastSegment);
      const asterisk = isRequired ? ' *' : '';

      const values = fieldValues.value;
      if (!values) return null;

      return (
        <React.Fragment key={index}>
          {values.map((v, i) => {
            if (typeof v !== 'object') {
              return (
                <GridItem key={`${index}:${i}`} md={6} vSpacing={1} hSpacing={0.5}>
                  <strong>
                    {label} {asterisk + ': '}
                  </strong>

                  {fileUploaderElement ? (
                    <a onClick={() => downloadFile(fileUploaderElement, fileUploaderElement?.propertyId)}>
                      {fileUploaderElement?.filename}
                    </a>
                  ) : (
                    v
                  )}
                </GridItem>
              );
            }
          })}
        </React.Fragment>
      );
    } else if (clonedElement.type !== 'ListWithDetail' && clonedElement?.elements) {
      return (
        <React.Fragment key={index}>
          <RenderFormReviewFields elements={clonedElement.elements} data={data} requiredFields={requiredFields} />
        </React.Fragment>
      );
    } else if (clonedElement.type === 'ListWithDetail' && data && data[lastSegment] && data[lastSegment].length > 0) {
      const listData = data[lastSegment];
      return (
        <ListWithDetail key={`${index}-${lastSegment}`}>
          <ListWithDetailHeading>
            {lastSegment}
            {listData.length > 1 && 's'}
          </ListWithDetailHeading>
          <Grid>
            {listData.map((childData: unknown, childIndex: number) => (
              <React.Fragment key={`${index}-${childIndex}`}>
                <RenderFormReviewFields
                  elements={clonedElement?.options?.detail?.elements || []}
                  data={childData}
                  requiredFields={requiredFields}
                />
              </React.Fragment>
            ))}
          </Grid>
        </ListWithDetail>
      );
    }
    return null;
  });
};
