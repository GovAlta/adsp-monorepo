import React from 'react';
import { GoAContainer } from '@abgov/react-components-new';
import { GroupLayout, LayoutProps, RankedTester, rankWith, uiTypeIs, withIncreasedRank } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { renderLayoutElements } from '../util/layout';
import { Hidden } from '@mui/material';

export const groupTester: RankedTester = rankWith(1, uiTypeIs('Group'));

const GoAGroupControlComponent = (props: LayoutProps): JSX.Element => {
  const { uischema, schema, path, enabled, renderers, cells, visible } = props;
  const group = uischema as GroupLayout;

  return (
    <Hidden xsUp={!visible}>
      <GoAContainer {...group.options} {...uischema?.options?.componentProps}>
        {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
      </GoAContainer>
    </Hidden>
  );
};

export const GoAGroupLayoutTester: RankedTester = withIncreasedRank(1, groupTester);

export const GoAGroupControl = withJsonFormsLayoutProps(GoAGroupControlComponent);
