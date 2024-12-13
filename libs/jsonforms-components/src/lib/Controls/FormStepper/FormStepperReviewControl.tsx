import React, { useState, useEffect } from 'react';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Categorization, Layout, SchemaBasedCondition, isVisible, Scoped } from '@jsonforms/core';
import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { CategorizationStepperLayoutReviewRendererProps } from './types';
import { Anchor, ReviewItem, ReviewItemHeader, ReviewItemSection, ReviewItemTitle } from './styled-components';
import { getProperty } from './util/helpers';
import { withAjvProps } from '../../util/layout';
import { GoAGrid } from '@abgov/react-components-new';
import { FormStepperComponentProps } from './types';
import { GoAReviewRenderers } from '../../../index';

export const FormStepperReviewer = (props: CategorizationStepperLayoutReviewRendererProps): JSX.Element => {
  const { uischema, data, schema, ajv, cells, renderers, visible, enabled, navigationFunc } = props;
  const componentProps = (uischema.options?.componentProps as FormStepperComponentProps) ?? {};
  const readOnly = componentProps?.readOnly ?? false;
  const categorization = uischema as Categorization;
  const categories = categorization.elements.filter((category) => isVisible(category, data, '', ajv));
  const rescopeMaps = ['#/properties/albertaAddress', '#/properties/canadianAddress', '#/properties/sin'];
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(window.innerWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <ReviewItem>
      {categories.map((category, index) => {
        const categoryLabel = category.label || category.i18n || 'Unknown Category';
        const testId = `${categoryLabel}-review-link`;
        const computedWidth = Math.max(600, containerWidth * 0.37);
        return (
          <ReviewItemSection key={index}>
            <ReviewItemHeader>
              <ReviewItemTitle>{categoryLabel}</ReviewItemTitle>
              {navigationFunc && (
                <Anchor
                  onClick={() => navigationFunc(index + 1)}
                  data-testid={testId}
                  onKeyDown={(e) => {
                    if (!readOnly && (e.key === ' ' || e.key === 'Enter')) {
                      e.preventDefault();
                      navigationFunc(index + 1);
                    }
                  }}
                >
                  {readOnly ? 'View' : 'Edit'}
                </Anchor>
              )}
            </ReviewItemHeader>
            <GoAGrid minChildWidth={`${computedWidth}px`}>
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
                    <div key={`form-stepper-category-${index}`} className="element-style">
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
export const FormStepperReviewControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormStepperReviewer)));

export default FormStepperReviewer;
