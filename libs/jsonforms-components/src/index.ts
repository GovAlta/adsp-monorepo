import { JsonFormsCellRendererRegistryEntry, JsonFormsRendererRegistryEntry } from '@jsonforms/core';

import {
  GoATextControlTester,
  GoAInputTextControl,
  GoADateControlTester,
  GoAInputDateControl,
  GoADateTimeControlTester,
  GoAInputDateTimeControl,
  GoATimeControlTester,
  GoAInputTimeControl,
  GoANumberControlTester,
  GoAInputNumberControl,
  GoAIntegerControlTester,
  GoAInputIntegerControl,
  CategorizationRendererTester,
  FormStepperControl,
  FileUploaderTester,
  FileUploader,
  FileUploaderReview,
  MultiLineTextControl,
  MultiLineTextControlTester,
  GoAEnumControl,
  GoAEnumControlTester,
  GoAEnumRadioGroupControl,
  GoARadioGroupControlTester,
  GoAEnumCheckboxGroupControl,
  GoACheckoutGroupControlTester,
  GoAArrayControlTester,
  GoAArrayControlRenderer,
  GoAListWithDetailsControlRenderer,
  GoAArrayControlReviewRenderer,
  GoAListWithDetailsTester,
  GoABooleanControlTester,
  GoABooleanControl,
  GoABooleanRadioControlTester,
  GoABooleanRadioControl,
  GoInputBaseReviewControl,
  AddressLookUpControl,
  AddressLookUpControlReview,
  AddressLookUpTester,
  FullNameTester,
  FullNameControl,
  FullNameDobControl,
  FullNameDobTester,
  FullNameReviewControl,
  FullNameDobReviewControl,
  FormStepperReviewer,
} from './lib/Controls';

import { InputCells } from './lib/Cells';
import {
  GoAVerticalLayout,
  GoAHorizontalLayout,
  GoAGroupLayoutTester,
  GoAGroupControl,
  GoAHorizontalLayoutTester,
  GoAlVerticalLayoutTester,
  GoAHorizontalReviewLayout,
} from './lib/layouts';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { HelpContent, HelpContentTester, HelpReviewContent } from './lib/Additional';
import GoAErrorControl, { GoAErrorControlTester } from './lib/ErrorHandling/GoAErrorControl';
import GoACalloutControl, { GoACalloutControlTester } from './lib/Additional/GoACalloutControl';
import { GoAGroupReviewControl, GoAGroupReviewLayoutTester } from './lib/layouts/GroupReviewControl';

export * from './lib/Context';
export * from './lib/common';
export * from './lib/Context/register';
export * from './lib/Controls';

export const GoABaseRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  { tester: GoAEnumControlTester, renderer: GoAEnumControl },
  { tester: GoAIntegerControlTester, renderer: GoAInputIntegerControl },
  { tester: GoANumberControlTester, renderer: GoAInputNumberControl },
  { tester: GoATextControlTester, renderer: GoAInputTextControl },
  { tester: GoADateControlTester, renderer: GoAInputDateControl },
  { tester: GoADateTimeControlTester, renderer: GoAInputDateTimeControl },
  { tester: GoATimeControlTester, renderer: GoAInputTimeControl },
  { tester: GoACalloutControlTester, renderer: GoACalloutControl },
  {
    tester: GoARadioGroupControlTester,
    renderer: GoAEnumRadioGroupControl,
  },
  {
    tester: GoACheckoutGroupControlTester,
    renderer: GoAEnumCheckboxGroupControl,
  },
  { tester: GoABooleanControlTester, renderer: GoABooleanControl },

  { tester: GoABooleanRadioControlTester, renderer: GoABooleanRadioControl },
  {
    tester: GoAArrayControlTester,
    renderer: GoAArrayControlRenderer,
  },
  {
    tester: GoAListWithDetailsTester,
    renderer: GoAListWithDetailsControlRenderer,
  },
  // layouts
  { tester: GoAGroupLayoutTester, renderer: GoAGroupControl },
  {
    tester: GoAHorizontalLayoutTester,
    renderer: GoAHorizontalLayout,
  },
  { tester: GoAlVerticalLayoutTester, renderer: GoAVerticalLayout },
  // additional
  { tester: GoAErrorControlTester, renderer: GoAErrorControl },
  {
    tester: MultiLineTextControlTester,
    renderer: MultiLineTextControl,
  },
  {
    tester: HelpContentTester,
    renderer: HelpContent,
  },
];

export const GoABaseReviewRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  { tester: GoAEnumControlTester, renderer: GoInputBaseReviewControl },
  { tester: GoAIntegerControlTester, renderer: GoInputBaseReviewControl },
  { tester: GoANumberControlTester, renderer: GoInputBaseReviewControl },
  { tester: GoATextControlTester, renderer: GoInputBaseReviewControl },
  { tester: GoADateControlTester, renderer: GoInputBaseReviewControl },
  { tester: GoADateTimeControlTester, renderer: GoInputBaseReviewControl },
  { tester: GoATimeControlTester, renderer: GoInputBaseReviewControl },
  {
    tester: GoARadioGroupControlTester,
    renderer: GoInputBaseReviewControl,
  },
  {
    tester: GoACheckoutGroupControlTester,
    renderer: GoInputBaseReviewControl,
  },
  { tester: GoABooleanControlTester, renderer: GoInputBaseReviewControl },

  { tester: GoABooleanRadioControlTester, renderer: GoInputBaseReviewControl },
  {
    tester: MultiLineTextControlTester,
    renderer: GoInputBaseReviewControl,
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
    tester: GoAHorizontalLayoutTester,
    renderer: GoAHorizontalReviewLayout,
  },
  { tester: GoAlVerticalLayoutTester, renderer: GoAVerticalLayout },
  { tester: GoAGroupReviewLayoutTester, renderer: GoAGroupReviewControl },
  { tester: HelpContentTester, renderer: HelpReviewContent },
];

export const GoAReviewRenderers: JsonFormsRendererRegistryEntry[] = [
  ...GoABaseReviewRenderers,
  { tester: CategorizationRendererTester, renderer: FormStepperReviewer },
  { tester: FileUploaderTester, renderer: withJsonFormsControlProps(FileUploaderReview) },
  { tester: FullNameTester, renderer: withJsonFormsControlProps(FullNameReviewControl) },
  { tester: FullNameDobTester, renderer: withJsonFormsControlProps(FullNameDobReviewControl) },
  { tester: AddressLookUpTester, renderer: withJsonFormsControlProps(AddressLookUpControlReview) },
];

export const GoARenderers: JsonFormsRendererRegistryEntry[] = [
  ...GoABaseRenderers,
  { tester: CategorizationRendererTester, renderer: FormStepperControl },
  { tester: FileUploaderTester, renderer: withJsonFormsControlProps(FileUploader) },
  { tester: AddressLookUpTester, renderer: withJsonFormsControlProps(AddressLookUpControl) },
  { tester: FullNameTester, renderer: withJsonFormsControlProps(FullNameControl) },
  { tester: FullNameDobTester, renderer: withJsonFormsControlProps(FullNameDobControl) },
];

export const GoACells: JsonFormsCellRendererRegistryEntry[] = [...InputCells];
