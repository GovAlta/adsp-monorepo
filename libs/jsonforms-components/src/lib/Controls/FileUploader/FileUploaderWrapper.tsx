import React, { ComponentType } from 'react';
import { StatePropsOfLayout, OwnPropsOfJsonFormsRenderer } from '@jsonforms/core';
import { AjvProps, withAjvProps } from '@jsonforms/material-renderers';
import { TranslateProps, withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { FileUploader } from './FileUploaderControl';

export interface FileUploaderLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps, ExtraProps {
  // eslint-disable-next-line
  data: any;
}
export interface ExtraProps {
  uploadTrigger?: ((file: File) => void) | undefined;
  downloadTrigger?: ((file: File) => void) | undefined;
  // eslint-disable-next-line
  latestFile: any;
}

export const FileUploaderWrapper = (extraProps: ExtraProps) => {
  return withExtraProps(extraProps, withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FileUploader))));
};

const withExtraProps = (
  extraProps: ExtraProps,
  Component: ComponentType<FileUploaderLayoutRendererProps & OwnPropsOfJsonFormsRenderer>
): ((props: FileUploaderLayoutRendererProps) => JSX.Element) => {
  return function withExtraProps(props: FileUploaderLayoutRendererProps) {
    return <Component {...extraProps} {...props} />;
  };
};