import React from 'react';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Categorization, Layout, SchemaBasedCondition, isVisible, Scoped } from '@jsonforms/core';
import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { CategorizationStepperLayoutReviewRendererProps } from './types';
import { Anchor, ReviewItem, ReviewItemHeader, ReviewItemSection, ReviewItemTitle } from './styled-components';
import { getProperty } from './util/helpers';
import { withAjvProps } from '../../util/layout';
import { GoabTable } from '@abgov/react-components';
import { FormStepperComponentProps } from './types';

import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { FullNameTester } from '../FullName/FullNameTester';
import { GoAInputBaseFullNameControlReview } from '../FullName/FullNameControlReview';
import { FullNameDobTester } from '../FullNameDOB/FullNameDobTester';
import { GoAInputBaseFullNameDobControlReview } from '../FullNameDOB/FullNameDobReviewControl';

import {
  GoAEnumControlTester,
  GoAIntegerControlTester,
  GoANumberControlTester,
  GoATextControlTester,
  GoADateControlTester,
  GoADateTimeControlTester,
  GoATimeControlTester,
  GoARadioGroupControlTester,
  GoACheckoutGroupControlTester,
  GoABooleanControlTester,
  GoABooleanRadioControlTester,
  MultiLineTextControlTester,
} from '../Inputs';
import { GoAArrayControlTester } from '../ObjectArray/ObjectArray';
import { GoAListWithDetailsTester } from '../ObjectArray/listWithDetails';

import { GoAInputBaseTableReviewControl } from '../Inputs/InputBaseTableReviewControl';
import { GoAInputBaseReviewControl } from '../Inputs/InputBaseReviewControl';

import { AddressLookUpTester } from '../AddressLookup/AddressLookupTester';
import { AddressLoopUpControlTableReview, AddressLookUpControlReview } from '../AddressLookup/AddressLookUpControlReview';

import { GoAHorizontalLayoutTester, GoAHorizontalReviewLayout } from '../../layouts/HorizontalLayoutControl';
import { GoAlVerticalLayoutTester, GoAVerticalLayout } from '../../layouts/VerticalLayoutControl';

import { GoAGroupReviewLayoutTester } from '../../layouts/GroupReviewControl';
import { HelpContentTester } from '../../Additional/HelpContent';
import { TableGroupLayoutRenderer, TableHelpContentRenderer, TableLayoutRenderer } from '../../layouts/TableLayoutRenderers';

export const GoABaseTableReviewRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  { tester: FullNameTester, renderer: GoAInputBaseFullNameControlReview },
  { tester: FullNameDobTester, renderer: GoAInputBaseFullNameDobControlReview },

  { tester: GoAEnumControlTester, renderer: GoAInputBaseTableReviewControl },
  { tester: GoAIntegerControlTester, renderer: GoAInputBaseTableReviewControl },
  { tester: GoANumberControlTester, renderer: GoAInputBaseTableReviewControl },
  { tester: GoATextControlTester, renderer: GoAInputBaseTableReviewControl },
  { tester: GoADateControlTester, renderer: GoAInputBaseTableReviewControl },
  { tester: GoADateTimeControlTester, renderer: GoAInputBaseTableReviewControl },
  { tester: GoATimeControlTester, renderer: GoAInputBaseTableReviewControl },
  {
    tester: GoARadioGroupControlTester,
    renderer: GoAInputBaseTableReviewControl,
  },
  {
    tester: GoACheckoutGroupControlTester,
    renderer: GoAInputBaseTableReviewControl,
  },
  { tester: GoABooleanControlTester, renderer: GoAInputBaseTableReviewControl },

  { tester: GoABooleanRadioControlTester, renderer: GoAInputBaseTableReviewControl },
  {
    tester: MultiLineTextControlTester,
    renderer: GoAInputBaseTableReviewControl,
  },
  {
    tester: GoAArrayControlTester,
    renderer: GoAInputBaseTableReviewControl,
  },
  {
    tester: GoAListWithDetailsTester,
    renderer: GoAInputBaseTableReviewControl,
  },
  {
    tester: FullNameDobTester,
    renderer: GoAInputBaseTableReviewControl,
  },
  { tester: AddressLookUpTester, renderer: withJsonFormsControlProps(AddressLoopUpControlTableReview) },

  {
    tester: GoAHorizontalLayoutTester,
    renderer: TableLayoutRenderer,
  },
  { tester: GoAlVerticalLayoutTester, renderer: TableLayoutRenderer },
  { tester: GoAGroupReviewLayoutTester, renderer: TableGroupLayoutRenderer },
  { tester: HelpContentTester, renderer: TableHelpContentRenderer },
];

export const GoABaseReviewRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  { tester: FullNameTester, renderer: GoAInputBaseFullNameControlReview },
  { tester: FullNameDobTester, renderer: GoAInputBaseFullNameDobControlReview },

  { tester: GoAEnumControlTester, renderer: GoAInputBaseReviewControl },
  { tester: GoAIntegerControlTester, renderer: GoAInputBaseReviewControl },
  { tester: GoANumberControlTester, renderer: GoAInputBaseReviewControl },
  { tester: GoATextControlTester, renderer: GoAInputBaseReviewControl },
  { tester: GoADateControlTester, renderer: GoAInputBaseReviewControl },
  { tester: GoADateTimeControlTester, renderer: GoAInputBaseReviewControl },
  { tester: GoATimeControlTester, renderer: GoAInputBaseReviewControl },
  {
    tester: GoARadioGroupControlTester,
    renderer: GoAInputBaseReviewControl,
  },
  {
    tester: GoACheckoutGroupControlTester,
    renderer: GoAInputBaseReviewControl,
  },
  { tester: GoABooleanControlTester, renderer: GoAInputBaseReviewControl },

  { tester: GoABooleanRadioControlTester, renderer: GoAInputBaseReviewControl },
  {
    tester: MultiLineTextControlTester,
    renderer: GoAInputBaseReviewControl,
  },
  {
    tester: GoAArrayControlTester,
    renderer: GoAInputBaseTableReviewControl, // Array might still need table or custom grid
  },
  {
    tester: GoAListWithDetailsTester,
    renderer: GoAInputBaseTableReviewControl, // List with details is complex
  },
  { tester: AddressLookUpTester, renderer: withJsonFormsControlProps(AddressLookUpControlReview) },

  {
    tester: GoAHorizontalLayoutTester,
    renderer: GoAHorizontalReviewLayout,
  },
  { tester: GoAlVerticalLayoutTester, renderer: GoAVerticalLayout },
  { tester: GoAGroupReviewLayoutTester, renderer: TableGroupLayoutRenderer },
  { tester: HelpContentTester, renderer: TableHelpContentRenderer },
];

export const FormStepperReviewer = (props: CategorizationStepperLayoutReviewRendererProps): JSX.Element => {
  const { uischema, data, schema, ajv, cells, enabled, navigationFunc } = props;
  const componentProps = (uischema.options?.componentProps as FormStepperComponentProps) ?? {};
  const readOnly = componentProps?.readOnly ?? false;
  const categorization = uischema as Categorization;
  const categories = categorization.elements.filter((category) => isVisible(category, data, '', ajv));
  const rescopeMaps = ['#/properties/albertaAddress', '#/properties/canadianAddress', '#/properties/sin'];

  return (
    <ReviewItem>
      {categories.map((category, categoryIndex) => {
        const categoryLabel = category.label || category.i18n || 'Unknown Category';
        const testId = `${categoryLabel}-review-link`;
        return (
          <ReviewItemSection key={categoryIndex}>
              <ReviewItemHeader>
                <ReviewItemTitle>{categoryLabel}</ReviewItemTitle>
              </ReviewItemHeader>

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
                .map((element, elementIndex) => {
                  const stepperElement = { ...element };
                  stepperElement.options = { ...stepperElement.options, stepId: categoryIndex };
                  return (
                    <GoabTable width="100%" key={elementIndex} mb="m">
                      <tbody>
                        <JsonFormsDispatch
                          data-testid={`jsonforms-object-list-defined-elements-dispatch`}
                          schema={schema}
                          uischema={stepperElement}
                          enabled={enabled}
                          renderers={GoABaseTableReviewRenderers}
                          cells={cells}
                        />
                      </tbody>
                    </GoabTable>
                  );
                })}

          </ReviewItemSection>
        );
      })}
    </ReviewItem>
  );
};
export const FormStepperReviewControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormStepperReviewer)));

export default FormStepperReviewer;
