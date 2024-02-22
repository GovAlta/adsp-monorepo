import React from 'react';
import { LayoutProps, VerticalLayout } from '@jsonforms/core';
import { LayoutRenderer, LayoutRendererProps } from '../util/layout';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

export const GoAVerticalLayoutComponent = ({
  uischema,
  schema,
  path,
  enabled,
  renderers,
  cells,
  visible,
}: LayoutProps) => {
  const verticalLayout = uischema as VerticalLayout;
  const childProps: LayoutRendererProps = {
    elements: verticalLayout.elements,
    schema,
    path,
    enabled,
    direction: 'column',
    visible,
  };

  return <LayoutRenderer {...childProps} renderers={renderers} cells={cells} />;
};

export const GoAVerticalLayout = withJsonFormsLayoutProps(GoAVerticalLayoutComponent, true);
