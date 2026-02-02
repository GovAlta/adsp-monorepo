import React from 'react';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Categorization, Layout, SchemaBasedCondition, isVisible, Scoped, UISchemaElement } from '@jsonforms/core';
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
import { GoAArrayControlTester, GoAArrayControlReviewRenderer } from '../ObjectArray/ObjectArray';
import { GoAListWithDetailsTester } from '../ObjectArray/listWithDetails';

import { GoAInputBaseTableReviewControl } from '../Inputs/InputBaseTableReviewControl';
import { GoAInputBaseReviewControl } from '../Inputs/InputBaseReviewControl';

import { AddressLookUpTester } from '../AddressLookup/AddressLookupTester';
import {
  AddressLoopUpControlTableReview,
  AddressLookUpControlReview,
} from '../AddressLookup/AddressLookUpControlReview';

import { GoAHorizontalLayoutTester, GoAHorizontalReviewLayout } from '../../layouts/HorizontalLayoutControl';
import { GoAlVerticalLayoutTester, GoAVerticalLayout } from '../../layouts/VerticalLayoutControl';

import { GoAGroupReviewLayoutTester } from '../../layouts/GroupReviewControl';
import { HelpContentTester } from '../../Additional/HelpContent';
import { GoACalloutControlTester, CalloutReviewControl } from '../../Additional/GoACalloutControl';
import { TableGroupLayoutRenderer, TableLayoutRenderer } from '../../layouts/TableLayoutRenderers';

const EmptyHelpContentRenderer = () => null;

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
    renderer: GoAArrayControlReviewRenderer,
  },
  {
    tester: GoAListWithDetailsTester,
    renderer: GoAArrayControlReviewRenderer,
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
  { tester: HelpContentTester, renderer: EmptyHelpContentRenderer },
  { tester: GoACalloutControlTester, renderer: CalloutReviewControl },
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
    renderer: GoAArrayControlReviewRenderer, // Array might still need table or custom grid
  },
  {
    tester: GoAListWithDetailsTester,
    renderer: GoAArrayControlReviewRenderer, // List with details is complex
  },
  { tester: AddressLookUpTester, renderer: withJsonFormsControlProps(AddressLookUpControlReview) },

  {
    tester: GoAHorizontalLayoutTester,
    renderer: GoAHorizontalReviewLayout,
  },
  { tester: GoAlVerticalLayoutTester, renderer: GoAVerticalLayout },
  { tester: GoAGroupReviewLayoutTester, renderer: TableGroupLayoutRenderer },

  { tester: HelpContentTester, renderer: EmptyHelpContentRenderer },
  { tester: GoACalloutControlTester, renderer: CalloutReviewControl },
];

export const FormStepperReviewer = (props: CategorizationStepperLayoutReviewRendererProps): JSX.Element => {
  const { uischema, data, schema, ajv, cells, enabled, navigationFunc } = props;
  const componentProps = (uischema.options?.componentProps as FormStepperComponentProps) ?? {};
  const readOnly = componentProps?.readOnly ?? false;
  const categorization = uischema as Categorization;
  const categories = categorization.elements.filter((category) => isVisible(category, data, '', ajv, undefined));
  const rescopeMaps = ['#/properties/albertaAddress', '#/properties/canadianAddress', '#/properties/sin'];

  return (
    <ReviewItem>
      {categories.map((category, categoryIndex) => {
        const categoryLabel = category.label || category.i18n || 'Unknown Category';
        const hasVisibleContent = (element: UISchemaElement & { elements?: UISchemaElement[] }): boolean => {
          if (!isVisible(element, data, '', ajv, undefined)) {
            return false;
          }
          if (element.type === 'HelpContent' || element.type === 'Callout') {
            return false;
          }
          if (element.elements && Array.isArray(element.elements)) {
            return element.elements.some((child) => hasVisibleContent(child));
          }

          return true;
        };

        const elementsToRender = category.elements
          //eslint-disable-next-line
          .filter((field) => {
            if (!hasVisibleContent(field)) {
              return false;
            }
            const conditionProps = field.rule?.condition as SchemaBasedCondition;
            /* istanbul ignore next */
            if (conditionProps && data) {
              const canHideControlParts = conditionProps?.scope?.split('/');
              const canHideControl = canHideControlParts && canHideControlParts[canHideControlParts?.length - 1];
              const isHidden = getProperty(data, canHideControl);
              if (!isHidden) {
                return field;
              }
              return false;
            }
            return true;
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
          .flat();

        if (elementsToRender.length === 0) {
          return null;
        }

        return (
          <ReviewItemSection key={categoryIndex}>
            <ReviewItemHeader>
              <ReviewItemTitle>{categoryLabel}</ReviewItemTitle>
            </ReviewItemHeader>

            {elementsToRender.map((element, elementIndex) => {
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
