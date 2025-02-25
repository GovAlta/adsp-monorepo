import React from 'react';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Categorization, Layout, SchemaBasedCondition, isVisible, Scoped } from '@jsonforms/core';
import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { CategorizationStepperLayoutReviewRendererProps } from './types';
import { TableReviewItemSection, TableReviewItem, TableReviewCategoryLabel } from './styled-components';
import { getProperty } from './util/helpers';
import { withAjvProps } from '../../util/layout';
import { GoATable } from '@abgov/react-components';
import { FormStepperComponentProps } from './types';
import { GoABaseTableReviewRenderers } from '../../../index';

export const FormStepperPageReviewer = (props: CategorizationStepperLayoutReviewRendererProps): JSX.Element => {
  const { uischema, data, schema, ajv, cells, enabled, navigationFunc } = props;
  const componentProps = (uischema.options?.componentProps as FormStepperComponentProps) ?? {};
  const categorization = uischema as Categorization;
  const categories = categorization.elements.filter((category) => isVisible(category, data, '', ajv));
  const rescopeMaps = ['#/properties/albertaAddress', '#/properties/canadianAddress', '#/properties/sin'];

  return (
    <TableReviewItem>
      <h2>Review your answers</h2>
      {categories.map((category, index) => {
        const categoryLabel = category.label || category.i18n || 'Unknown Category';
        return (
          <>
            <TableReviewCategoryLabel>{categoryLabel}</TableReviewCategoryLabel>
            <TableReviewItemSection key={index}>
              {category.elements
                .filter((field) => {
                  // [TODO] we need to double check why we cannot hide the elements at the element level
                  const conditionProps = field.rule?.condition as SchemaBasedCondition;
                  /* istanbul ignore next */
                  if (conditionProps && data) {
                    const canHideControlParts = conditionProps?.scope?.split('/');
                    const canHideControl = canHideControlParts && canHideControlParts[canHideControlParts?.length - 1];
                    const isHidden = getProperty(data, canHideControl);
                    if (!isHidden) {
                      return field;
                    }
                  } else {
                    return field;
                  }
                })
                .map((e) => {
                  const layout = e as Layout;
                  if (
                    rescopeMaps.some((scope) =>
                      layout.elements
                        ?.map((el) => {
                          const element = el as unknown as Scoped;
                          return element.scope;
                        })
                        .includes(scope)
                    )
                  ) {
                    return layout.elements;
                  } else {
                    return e;
                  }
                })
                .flat()
                .map((element) => {
                  return (
                    <GoATable width="100%">
                      <tbody>
                        <JsonFormsDispatch
                          data-testid={`jsonforms-object-list-defined-elements-dispatch`}
                          schema={schema}
                          uischema={{ ...element, options: { ...element?.options, categoryIndex: index } }}
                          enabled={enabled}
                          renderers={GoABaseTableReviewRenderers}
                          cells={cells}
                        />
                      </tbody>
                    </GoATable>
                  );
                })}
            </TableReviewItemSection>
          </>
        );
      })}
    </TableReviewItem>
  );
};
export const FormStepperPageReviewControl = withAjvProps(
  withTranslateProps(withJsonFormsLayoutProps(FormStepperPageReviewer))
);

export default FormStepperPageReviewer;
