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
  CategorizationStepperRendererTester,
  CategorizationPagesRendererTester,
  FormStepperControl,
  FormStepperPagesControl,
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
  FormStepperReviewControl,
  GoAInputBaseTableReviewControl,
  AddressLoopUpControlTableReview,
  GoAInputBaseFullNameControlReview,
  GoAInputBaseFullNameDobControlReview,
  GoAEmailControlTester,
  GoAInputEmailControl,
  PhoneNumberTester,
  PhoneNumberReviewControl,
  PhoneNumberControl,
  PhoneNumberWithTypeTester,
  PhoneNumberWithTypeControl,
  GoACalculationControlTester,
  GoACalculationControl,
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
import GoACalloutControl, { GoACalloutControlTester, CalloutReviewControl } from './lib/Additional/GoACalloutControl';
import { GoAGroupReviewControl, GoAGroupReviewLayoutTester } from './lib/layouts/GroupReviewControl';
import { PhoneNumberWithTypeReviewControl } from './lib/Controls/PhoneNumber/PhoneNumberWithTypeReviewControl';

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
  { tester: GoAEmailControlTester, renderer: GoAInputEmailControl },
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
  { tester: GoACalloutControlTester, renderer: CalloutReviewControl },
];

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
    renderer: GoAInputBaseTableReviewControl,
  },
  { tester: GoAlVerticalLayoutTester, renderer: GoAInputBaseTableReviewControl },
  { tester: GoAGroupReviewLayoutTester, renderer: GoAInputBaseTableReviewControl },
  { tester: HelpContentTester, renderer: GoAInputBaseTableReviewControl },
];

export const GoAReviewRenderers: JsonFormsRendererRegistryEntry[] = [
  ...GoABaseReviewRenderers,
  { tester: CategorizationStepperRendererTester, renderer: FormStepperReviewControl },
  { tester: CategorizationPagesRendererTester, renderer: FormStepperReviewControl },
  { tester: FileUploaderTester, renderer: withJsonFormsControlProps(FileUploaderReview) },
  { tester: FullNameTester, renderer: withJsonFormsControlProps(FullNameReviewControl) },
  { tester: FullNameDobTester, renderer: withJsonFormsControlProps(FullNameDobReviewControl) },
  { tester: AddressLookUpTester, renderer: withJsonFormsControlProps(AddressLookUpControlReview) },
  { tester: PhoneNumberTester, renderer: withJsonFormsControlProps(PhoneNumberReviewControl) },
  { tester: PhoneNumberWithTypeTester, renderer: withJsonFormsControlProps(PhoneNumberWithTypeReviewControl) },
];

export const GoARenderers: JsonFormsRendererRegistryEntry[] = [
  ...GoABaseRenderers,
  { tester: CategorizationStepperRendererTester, renderer: FormStepperControl },
  { tester: CategorizationPagesRendererTester, renderer: FormStepperPagesControl },
  { tester: FileUploaderTester, renderer: withJsonFormsControlProps(FileUploader) },
  { tester: AddressLookUpTester, renderer: withJsonFormsControlProps(AddressLookUpControl) },
  { tester: FullNameTester, renderer: withJsonFormsControlProps(FullNameControl) },
  { tester: FullNameDobTester, renderer: withJsonFormsControlProps(FullNameDobControl) },
  { tester: PhoneNumberTester, renderer: withJsonFormsControlProps(PhoneNumberControl) },
  { tester: PhoneNumberWithTypeTester, renderer: withJsonFormsControlProps(PhoneNumberWithTypeControl) },
  { tester: GoACalculationControlTester, renderer: GoACalculationControl },
];

export const GoACells: JsonFormsCellRendererRegistryEntry[] = [...InputCells];
