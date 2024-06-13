import React from 'react';
import { LayoutProps, RankedTester, rankWith, uiTypeIs, HorizontalLayout } from '@jsonforms/core';
import { LayoutRenderer, LayoutRendererProps, forwardOptionsInElements, fetchWidthInLayout } from '../util/layout';
import { withJsonFormsLayoutProps } from '@jsonforms/react';

export const GoAHorizontalLayoutTester: RankedTester = rankWith(2, uiTypeIs('HorizontalLayout'));

export const GoAHorizontalLayoutComponent = ({
  uischema,
  renderers,
  cells,
  schema,
  path,
  enabled,
  visible,
}: LayoutProps) => {
  const childProps: LayoutRendererProps = {
    elements: forwardOptionsInElements(uischema),
    schema,
    path,
    enabled,
    direction: 'row',
    visible,
    width: fetchWidthInLayout(uischema),
  };

  return <LayoutRenderer {...childProps} renderers={renderers} cells={cells} />;
};

export const GoAHorizontalLayout = withJsonFormsLayoutProps(GoAHorizontalLayoutComponent, true);
