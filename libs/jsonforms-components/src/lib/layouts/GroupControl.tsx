import { GoAContainer } from '@abgov/react-components-new';
import { GroupLayout, LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';
import { renderLayoutElements } from '../util/layout';
import { Hidden } from '@mui/material';

const GoAGroupControl = (props: LayoutProps): JSX.Element => {
  const { uischema, schema, path, enabled, renderers, cells, visible } = props;
  const group = uischema as GroupLayout;

  return (
    <Hidden xsUp={!visible}>
      <GoAContainer {...group.options}>
        {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
      </GoAContainer>
    </Hidden>
  );
};

export const groupLayoutTester: RankedTester = rankWith(1, uiTypeIs('Group'));

export default withJsonFormsLayoutProps(GoAGroupControl);
