import React from 'react';
import { ControlElement, ControlProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

interface OptionProps {
  url?: string;
  width?: string;
  height?: string;
  alt?: string;
}

interface ImageCustomControlElement extends ControlElement {
  options?: OptionProps;
}

interface ImageCustomControlProps extends ControlProps {
  uischema: ImageCustomControlElement;
}

export const ImageComponent = ({ uischema }: ImageCustomControlProps): JSX.Element => {
  const url = uischema.options?.url || '';
  const width = uischema.options?.width || '';
  const height = uischema.options?.height || '';
  const alt = uischema.options?.alt || '';

  return <img src={url} width={width} height={height} alt={alt} />;
};

export const ImageControlTester: RankedTester = rankWith(1, uiTypeIs('ImageContent'));

export const ImageControl = withJsonFormsControlProps(ImageComponent);
