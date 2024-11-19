import { JsonFormsDispatch } from '@jsonforms/react';
import { Categorization, SchemaBasedCondition, isVisible } from '@jsonforms/core';
import { CategorizationStepperLayoutReviewRendererProps } from './types';
import { Anchor, ReviewItem, ReviewItemHeader, ReviewItemSection, ReviewItemTitle } from './styled-components';
import { getProperty } from './util/helpers';
import { GoAGrid } from '@abgov/react-components-new';
import { FormStepperComponentProps } from './types';
import { GoAReviewRenderers } from '../../../index';

export const FormStepperReviewer = (props: CategorizationStepperLayoutReviewRendererProps): JSX.Element => {
  const { uischema, data, schema, ajv, cells, renderers, visible, enabled, navigationFunc } = props;
  const componentProps = (uischema.options?.componentProps as FormStepperComponentProps) ?? {};
  const readOnly = componentProps?.readOnly ?? false;
  const categorization = uischema as Categorization;
  const categories = categorization.elements.filter((category) => isVisible(category, data, '', ajv));

  return (
    <ReviewItem>
      {categories.map((category, index) => {
        const categoryLabel = category.label || category.i18n || 'Unknown Category';
        const testId = `${categoryLabel}-review-link`;
        return (
          <ReviewItemSection key={index}>
            <ReviewItemHeader>
              <ReviewItemTitle>{categoryLabel}</ReviewItemTitle>
              {navigationFunc && (
                <Anchor onClick={() => navigationFunc(index + 1)} data-testid={testId}>
                  {readOnly ? 'View' : 'Edit'}
                </Anchor>
              )}
            </ReviewItemHeader>
            <GoAGrid minChildWidth="600px">
              {category.elements
                .filter((field) => {
                  const conditionProps = field.rule?.condition as SchemaBasedCondition;
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
                .map((element, index) => {
                  return (
                    <div key={`form-stepper-category-${index}`}>
                      <JsonFormsDispatch
                        data-testid={`jsonforms-object-list-defined-elements-dispatch`}
                        schema={schema}
                        uischema={element}
                        enabled={enabled}
                        renderers={GoAReviewRenderers}
                        cells={cells}
                      />
                    </div>
                  );
                })}
            </GoAGrid>
          </ReviewItemSection>
        );
      })}
    </ReviewItem>
  );
};
