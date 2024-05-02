import { ControlElement } from '@jsonforms/core';
import { GridItem } from '../../../common/Grid';
import { InputValue, getFormFieldValue, labelToString } from './GenerateFormFields';
import React from 'react';

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
        renderValue(`${label}${asterisk}:`, `${index}`, fieldValues.value, fileUploaderElement, downloadFile)}
      {fieldValues.type === 'object' &&
        values &&
        values.length > 0 &&
        values.map((v, i) => {
          return renderValue(`${v[0]}: `, `${index}:${i}`, v[1]);
        })}
    </React.Fragment>
  );
};
