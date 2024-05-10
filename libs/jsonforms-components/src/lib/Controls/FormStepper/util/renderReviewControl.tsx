import { ControlElement } from '@jsonforms/core';
import { Grid, GridItem } from '../../../common/Grid';
import { InputValue, NestedStringArray, getFormFieldValue, labelToString } from './GenerateFormFields';
import React from 'react';
import { GoADivider } from '@abgov/react-components-new';

export interface FileElement extends File {
  filename: string;
  propertyId: string;
}

const renderValue = (
  label: string,
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  fileUploaderElement?: FileElement,
  downloadFile?: (file: File, propertyId: string) => void
): JSX.Element => {
  const actualValue = fileUploaderElement ? renderFileLink(fileUploaderElement, downloadFile!) : value ? value : '';
  return (
    <GridItem key={key} md={6} vSpacing={1} hSpacing={0.5}>
      <strong>{label}</strong>
      {actualValue}
    </GridItem>
  );
};

const renderArray = () => {};

const renderFileLink = (
  fileUploaderElement: FileElement,
  downloadFile: (file: File, propertyId: string) => void
): JSX.Element => {
  return (
    <a onClick={() => downloadFile(fileUploaderElement, fileUploaderElement?.propertyId)}>
      {fileUploaderElement?.filename}
    </a>
  );
};

export const renderReviewControl = (
  data: unknown,
  element: ControlElement,
  requiredFields: string[],
  index: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fileList: Record<string, any>,
  downloadFile: (file: File, propertyId: string) => void
): JSX.Element | null => {
  const fieldName: string = element.scope.split('/').pop() || '';
  const label = labelToString(element.label, element.scope);
  if (!fieldName || !label) return null;
  const isFileUploader = element.scope.includes('fileUploader');
  const fileUploaderElement = isFileUploader ? fileList && fileList[fieldName] : null;
  const fieldValues: InputValue = getFormFieldValue(element.scope, data ? data : {});
  const isRequired = requiredFields.includes(fieldName);
  const asterisk = isRequired ? ' *' : '';

  const values = fieldValues.value;

  return (
    <React.Fragment key={index}>
      {fieldValues.type === 'primitive' &&
        renderValue(`${label}${asterisk}: `, `${index}`, fieldValues.value, fileUploaderElement, downloadFile)}
      {fieldValues.type === 'object' &&
        values &&
        values.length > 0 &&
        (values as string[][]).map((v, i) => {
          return renderValue(`${v[0]}: `, `${index}:${i}`, v[1]);
        })}
      {fieldValues.type === 'array' && values && values.length > 0 && renderListDetails(values as NestedStringArray)}
    </React.Fragment>
  );
};

const renderListDetails = (items: NestedStringArray): JSX.Element => {
  return (
    <React.Fragment>
      {items.map((item, itemIndex) => {
        const details = Array.isArray(item) ? item : [undefined, [undefined, undefined]];
        return (
          <>
            <Grid key={`item-${itemIndex}`}>
              {(details[1] as NestedStringArray).map((detail, detailIndex) => {
                const safeDetail = Array.isArray(detail) ? detail : [undefined, undefined];
                return renderValue(`${safeDetail[0]}: `, `item-${itemIndex}-detail-${detailIndex}}`, safeDetail[1]);
              })}
            </Grid>
            {itemIndex < items.length - 1 ? <GoADivider mb="m"></GoADivider> : null}
          </>
        );
      })}
    </React.Fragment>
  );
};
