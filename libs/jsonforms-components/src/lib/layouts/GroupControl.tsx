import { GoAContainer } from '@abgov/react-components-new';
import { GroupLayout, LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';
import { renderLayoutElements } from '../util/layout';

const GoAGroupControl = (props: LayoutProps): JSX.Element => {
  const { uischema, schema, path, enabled, renderers, cells } = props;
  const group = uischema as GroupLayout;

  return (
    <GoAContainer {...group.options}>
      {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
    </GoAContainer>
  );
};

export const groupLayoutTester: RankedTester = rankWith(3, uiTypeIs('Group'));

export default withJsonFormsLayoutProps(GoAGroupControl);
