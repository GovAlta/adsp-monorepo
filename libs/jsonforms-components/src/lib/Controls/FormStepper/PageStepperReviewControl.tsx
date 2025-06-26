import { GoAButton, GoATable } from '@abgov/react-components';
import { Categorization, isVisible, Layout, SchemaBasedCondition, Scoped, UISchemaElement } from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { useContext } from 'react';
import { GoABaseTableReviewRenderers } from '../../../index';
import { withAjvProps } from '../../util/layout';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from './context';
import {
  TableReviewCategoryLabel,
  TableReviewItem,
  TableReviewItemSection,
  TableReviewPageTitleRow,
} from './styled-components';
import { CategorizationStepperLayoutReviewRendererProps } from './types';
import { getProperty } from './util/helpers';

export const FormStepperPageReviewer = (props: CategorizationStepperLayoutReviewRendererProps): JSX.Element => {
  const { data, schema, ajv, cells, enabled, navigationFunc } = props;
  const rescopeMaps = ['#/properties/albertaAddress', '#/properties/canadianAddress', '#/properties/sin'];
  const formStepperCtx = useContext(JsonFormsStepperContext);
  const categories = (formStepperCtx as JsonFormsStepperContextProps)
    .selectStepperState()
    .categories.filter((category) => isVisible(category?.uischema as UISchemaElement, data, '', ajv));
  return (
    <TableReviewItem>
      <h2>Review your answers</h2>
      {categories.map((category, index) => {
        const categoryLabel = category.label || (category?.uischema && category?.uischema.i18n) || 'Unknown Category';
        return (
          <>
            <TableReviewPageTitleRow>
              <TableReviewCategoryLabel>{categoryLabel}</TableReviewCategoryLabel>
              <GoAButton
                type="tertiary"
                testId={`page-review-change-${category.label}-btn`}
                onClick={() => {
                  if (formStepperCtx) {
                    formStepperCtx.toggleShowReviewLink(category?.id);
                    formStepperCtx.goToPage(category?.id);
                  }
                }}
              >
                Change
              </GoAButton>
            </TableReviewPageTitleRow>
            <TableReviewItemSection key={index}>
              {category.uischema?.elements
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
                .map((element, index) => {
                  return (
                    <GoATable width="100%" key={index}>
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
