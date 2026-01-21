import React from 'react';
import { GoabContainer } from '@abgov/react-components';
import { GroupLayout, LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { renderLayoutElements } from '../util/layout';
import { Visible } from '../util';

type GoabContainerAccent = React.ComponentProps<typeof GoabContainer>['accent'];

export interface withIsStepper {
  isStepperReview: boolean;
}

export const GoAGroupControlComponent = (props: LayoutProps & withIsStepper): JSX.Element => {
  const { uischema, schema, path, enabled, renderers, cells, visible, isStepperReview } = props;

  const group = uischema as GroupLayout;

  const componentProps = group.options?.componentProps;
  const accent = componentProps?.accent as GoabContainerAccent | undefined;

  return (
    <Visible visible={visible}>
      {accent === 'thick' && (
        <GoabContainer heading={group.label} {...componentProps}>
          {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
        </GoabContainer>
      )}

      {(accent === 'thin' || accent === 'filled') && (
        <div>
          {group.label && <h3>{group.label}</h3>}
          <GoabContainer {...componentProps}>
            {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
          </GoabContainer>
        </div>
      )}

      {componentProps && !accent && (
        <div>
          {group.label && <h3>{group.label}</h3>}
          <GoabContainer {...componentProps}>
            {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
          </GoabContainer>
        </div>
      )}

      {!componentProps && (
        <div>
          {group.label && <h3>{group.label}</h3>}
          {isStepperReview ? (
            <>{renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}</>
          ) : (
            <GoabContainer>
              {renderLayoutElements(group.elements, schema, path, enabled, renderers, cells)}
            </GoabContainer>
          )}
        </div>
      )}
    </Visible>
  );
};

export const GoAGroupLayoutTester: RankedTester = rankWith(1, uiTypeIs('Group'));

export const GoAGroupControl = withJsonFormsLayoutProps(GoAGroupControlComponent);
