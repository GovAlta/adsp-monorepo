import React, { ComponentType } from 'react';
import { StatePropsOfLayout, OwnPropsOfJsonFormsRenderer } from '@jsonforms/core';
import { AjvProps, withAjvProps } from '@jsonforms/material-renderers';
import { TranslateProps, withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { FileUploader } from './FileUploaderControl';

export interface FileUploaderLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  // eslint-disable-next-line
  data: any;
  token: string;
  uploadPath: string;
  uploadTrigger: ((file: File) => void) | undefined;
  downloadTrigger: ((file: File) => void) | undefined;
  latestFile: any;
}
export interface ExtraProps {
  token: string;
  uploadPath: string;
  uploadTrigger: ((file: File) => void) | undefined;
  downloadTrigger: ((file: File) => void) | undefined;
  latestFile: any;
}

export const FileUploaderWrapper = (
  token: string,
  uploadPath: string,
  uploadTrigger?: ((file: File) => void) | undefined,
  downloadTrigger?: ((file: File) => void) | undefined,
  latestFile?: any
) => {
  const props = {
    token: token,
    uploadPath: uploadPath,
    uploadTrigger: uploadTrigger,
    downloadTrigger: downloadTrigger,
    latestFile: latestFile,
  };
  return withExtraProps(props, withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FileUploader))));
};

const withExtraProps = (
  extraProps: ExtraProps,
  Component: ComponentType<FileUploaderLayoutRendererProps & OwnPropsOfJsonFormsRenderer>
): ((props: FileUploaderLayoutRendererProps) => JSX.Element) => {
  return function withExtraProps(props: FileUploaderLayoutRendererProps) {
    return <Component {...extraProps} {...props} />;
  };
};
