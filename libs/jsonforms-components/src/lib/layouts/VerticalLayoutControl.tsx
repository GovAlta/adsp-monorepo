import React from 'react';
import { LayoutRenderer, LayoutRendererProps } from '../util/layout';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { LayoutProps, RankedTester, rankWith, uiTypeIs, VerticalLayout } from '@jsonforms/core';
import { Spacing } from '@abgov/react-components';

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
  const spacing: Spacing = uischema?.options?.spacing || 's';
  const childProps: LayoutRendererProps = {
    elements: verticalLayout.elements,
    schema,
    path,
    enabled,
    direction: 'column',
    visible,
    option: {
      space: 'xl',
    },
  };

  return <LayoutRenderer {...childProps} renderers={renderers} cells={cells} />;
};

export const GoAlVerticalLayoutTester: RankedTester = rankWith(1, uiTypeIs('VerticalLayout'));

export const GoAVerticalLayout = withJsonFormsLayoutProps(GoAVerticalLayoutComponent, true);
