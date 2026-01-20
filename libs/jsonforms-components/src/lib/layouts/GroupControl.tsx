import { GoabContainer, GoabTable } from '@abgov/react-components';
import { GroupLayout, LayoutProps, RankedTester, rankWith, uiTypeIs, withIncreasedRank } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import { JsonFormsDispatch } from '@jsonforms/react';
import { renderLayoutElements } from '../util/layout';
import { Visible } from '../util';

export interface withIsStepper {
  isStepperReview: boolean;
}

export const GoAGroupControlComponent = (props: LayoutProps & withIsStepper): JSX.Element => {
  const { uischema, schema, path, enabled, renderers, cells, visible, isStepperReview } = props;
  const group = uischema as GroupLayout;

  const renderGroupElements = () => {
    return group.elements.map((child, index) => {
      const options = { ...child.options };
      if (group.options?.stepId !== undefined) {
        options.stepId = group.options.stepId;
      }
      if (group.options?.categoryIndex !== undefined) {
        options.categoryIndex = group.options.categoryIndex;
      }

      return (
        <JsonFormsDispatch
          uischema={{ ...child, options }}
          schema={schema}
          key={`review-${path}_${index}`}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      );
    });
  };

  return (
    <Visible visible={visible}>
      <tr data-testid={`group-${path}`}>
        <td colSpan={3} style={{ padding: 0, border: 'none' }}>
          {group.options?.componentProps?.accent === 'thick' && (
            <GoabContainer heading={group.label} {...group.options?.componentProps}>
              <GoabTable width="100%" mt="s">
                <tbody>{renderGroupElements()}</tbody>
              </GoabTable>
            </GoabContainer>
          )}
          {(group.options?.componentProps?.accent === 'thin' || group.options?.componentProps?.accent === 'filled') && (
            <div>
              {group.label && <h3>{group.label}</h3>}
              <GoabContainer {...group.options?.componentProps}>
                <GoabTable width="100%">
                  <tbody>{renderGroupElements()}</tbody>
                </GoabTable>
              </GoabContainer>
            </div>
          )}
          {group.options?.componentProps && !group.options?.componentProps?.accent && (
            <div>
              {group.label && <h3>{group.label}</h3>}
              <GoabContainer {...group.options?.componentProps}>
                <GoabTable width="100%">
                  <tbody>{renderGroupElements()}</tbody>
                </GoabTable>
              </GoabContainer>
            </div>
          )}
          {!group.options?.componentProps && (
            <div>
              {group.label && <h3>{group.label}</h3>}
              {isStepperReview && (
                <GoabTable width="100%">
                  <tbody>{renderGroupElements()}</tbody>
                </GoabTable>
              )}
              {!isStepperReview && (
                <GoabContainer>
                  <GoabTable width="100%">
                    <tbody>{renderGroupElements()}</tbody>
                  </GoabTable>
                </GoabContainer>
              )}
            </div>
          )}
        </td>
      </tr>
    </Visible>
  );
};

export const GoAGroupLayoutTester: RankedTester = rankWith(1, uiTypeIs('Group'));

export const GoAGroupControl = withJsonFormsLayoutProps(GoAGroupControlComponent, true);
