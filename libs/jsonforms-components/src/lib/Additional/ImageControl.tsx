import React from 'react';
import { ControlElement, ControlProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

interface OptionProps {
  url?: string;
  width?: string;
  height?: string;
  alt?: string;
}

interface CustomControlElement extends ControlElement {
  options?: OptionProps;
}

interface CustomControlProps extends ControlProps {
  uischema: CustomControlElement;
}

export const ImageComponent = ({ ...props }: CustomControlProps): JSX.Element => {
  const { uischema } = props;

  const url = uischema.options?.url || '';
  const width = uischema.options?.width || '';
  const height = uischema.options?.height || '';
  const alt = uischema.options?.alt || '';

  return <img src={url} width={width} height={height} alt={alt} />;
};

export const ImageContentTester: RankedTester = rankWith(1, uiTypeIs('ImageContent'));

export const ImageContent = withJsonFormsControlProps(ImageComponent);
