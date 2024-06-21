import React from 'react';
import { LayoutRenderer, LayoutRendererProps } from '../util/layout';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { LayoutProps, RankedTester, rankWith, uiTypeIs, VerticalLayout } from '@jsonforms/core';

export const GoAVerticalLayoutComponent = ({
  uischema,
  schema,
  path,
  enabled,
  renderers,
  cells,
  visible,
}: LayoutProps) => {
  const layout = uischema as VerticalLayout;

  const childProps: LayoutRendererProps = {
    elements: layout.elements,
    schema,
    path,
    enabled,
    direction: 'column',
    visible,
  };

  return <LayoutRenderer {...childProps} renderers={renderers} cells={cells} />;
};

export const GoAlVerticalLayoutTester: RankedTester = rankWith(1, uiTypeIs('VerticalLayout'));

export const GoAVerticalLayout = withJsonFormsLayoutProps(GoAVerticalLayoutComponent, true);
