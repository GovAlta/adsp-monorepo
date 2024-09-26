import React from 'react';
import { GoAContainer } from '@abgov/react-components-new';
import { GroupLayout, LayoutProps, RankedTester, rankWith, uiTypeIs, withIncreasedRank } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { renderLayoutElements } from '../util/layout';
import { Visible } from '../util';

export interface withIsStepper {
  isStepperReview: boolean;
}

export const GoAGroupControlComponent = (props: LayoutProps & withIsStepper): JSX.Element => {
  const { uischema, schema, path, enabled, renderers, cells, visible, isStepperReview } = props;
  const group = uischema as GroupLayout;

  return (
    <Visible visible={visible}>
      {group.options?.componentProps?.accent === 'thick' && (
        <GoAContainer heading={group.label} {...group.options?.componentProps}>
          {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
        </GoAContainer>
      )}
      {(group.options?.componentProps?.accent === 'thin' || group.options?.componentProps?.accent === 'filled') && (
        <div>
          {group.label && <h3>{group.label}</h3>}
          <GoAContainer {...group.options?.componentProps}>
            {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
          </GoAContainer>
        </div>
      )}
      {group.options?.componentProps && !group.options?.componentProps?.accent && (
        <div>
          {group.label && <h3>{group.label}</h3>}
          <GoAContainer {...group.options?.componentProps}>
            {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
          </GoAContainer>
        </div>
      )}
      {!group.options?.componentProps && (
        <div>
          {group.label && <h3>{group.label}</h3>}
          {isStepperReview && <>{renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}</>}
          {!isStepperReview && (
            <GoAContainer>{renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}</GoAContainer>
          )}
        </div>
      )}
    </Visible>
  );
};

export const GoAGroupLayoutTester: RankedTester = rankWith(1, uiTypeIs('Group'));

export const GoAGroupControl = withJsonFormsLayoutProps(GoAGroupControlComponent, true);
