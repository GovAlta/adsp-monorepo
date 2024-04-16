import { UISchemaElement, Category, Categorization, isVisible } from '@jsonforms/core';
import React, { useContext } from 'react';
import { Grid, GridItem } from '../../../common/Grid';
import { ListWithDetail, ListWithDetailHeading } from '../styled-components';
import { JsonFormContext } from '../../../Context';

interface RenderFormFieldsProps {
  elements: UISchemaElement[] | (Category | Categorization)[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  requiredFields: string[];
}

export const resolveLabelFromScope = (scope: string) => {
  // eslint-disable-next-line no-useless-escape
  const validPatternRegex = /^#(\/properties\/[^\/]+)+$/;
  const isValid = validPatternRegex.test(scope);
  if (!isValid) return null;

  const lastSegment = scope.split('/').pop();

  if (lastSegment) {
    const lowercased = lastSegment.replace(/([A-Z])/g, ' $1').toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }
  return '';
};

export const getFormFieldValue = (scope: string, data: object) => {
  if (data !== undefined) {
    const pathArray = scope.replace('#/properties/', '').replace('properties/', '').split('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentValue: any = data;
    for (const key of pathArray) {
      if (currentValue[key] === undefined) {
        return '';
      }
      currentValue = currentValue[key];
    }
    return Array.isArray(currentValue)
      ? currentValue[currentValue.length - 1]
      : typeof currentValue === 'object'
      ? ''
      : currentValue;
  } else {
    return '';
  }
};

export const RenderFormFields: React.FC<RenderFormFieldsProps> = ({ elements, data, requiredFields }) => {
  const enumerators = useContext(JsonFormContext);
  const downloadTriggerFunction = enumerators?.functions?.get('download-file');
  const downloadTrigger = downloadTriggerFunction && downloadTriggerFunction();
  const fileListValue = enumerators?.data?.get('file-list');

  // eslint-disable-next-line
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
      const value = getFormFieldValue(clonedElement.scope, data ? data : {}).toString();
      const isRequired = requiredFields.includes(lastSegment);
      const asterisk = isRequired ? ' *' : '';

      return (
        <GridItem key={index} md={6} vSpacing={1} hSpacing={0.5}>
          <strong>
            {label} {asterisk + ': '}
          </strong>

          {fileUploaderElement ? (
            <a onClick={() => downloadFile(fileUploaderElement, fileUploaderElement?.propertyId)}>
              {fileUploaderElement?.filename}
            </a>
          ) : (
            value
          )}
        </GridItem>
      );
    } else if (clonedElement.type !== 'ListWithDetail' && clonedElement?.elements) {
      return (
        <React.Fragment key={index}>
          <RenderFormFields elements={clonedElement.elements} data={data} requiredFields={requiredFields} />
        </React.Fragment>
      );
    } else if (clonedElement.type === 'ListWithDetail' && data && data[lastSegment] && data[lastSegment].length > 0) {
      const listData = data[lastSegment];
      return (
        <ListWithDetail>
          <ListWithDetailHeading>
            {lastSegment}
            {listData.length > 1 && 's'}
          </ListWithDetailHeading>
          <Grid>
            {listData.map(
              (
                childData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
                childIndex: any // eslint-disable-line @typescript-eslint/no-explicit-any
              ) => (
                <React.Fragment key={`${index}-${childIndex}`}>
                  <RenderFormFields
                    elements={clonedElement.elements}
                    data={childData}
                    requiredFields={requiredFields}
                  />
                </React.Fragment>
              )
            )}
          </Grid>
        </ListWithDetail>
      );
    }
    return null;
  });
};
