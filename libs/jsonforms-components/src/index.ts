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
  MultiLineTextControl,
  MultiLineTextControlTester,
  GoAEnumControl,
  GoAEnumControlTester,
  GoAEnumRadioGroupControl,
  GoARadioGroupControlTester,
  GoAArrayControlTester,
  GoAArrayControlRenderer,
  GoAListWithDetailsTester,
  GoABooleanControlTester,
  GoABooleanControl,
  GoABooleanRadioControlTester,
  GoABooleanRadioControl,
} from './lib/Controls';
import { InputCells } from './lib/Cells';
import {
  GoAVerticalLayout,
  GoAHorizontalLayout,
  GoAGroupLayoutTester,
  GoAGroupControl,
  GoAHorizontalLayoutTester,
  GoAlVerticalLayoutTester,
} from './lib/layouts';
import { withJsonFormsControlProps } from '@jsonforms/react';

import { HelpContent, HelpContentTester, ImageControl, ImageControlTester } from './lib/Additional';
import GoAErrorControl, { GoAErrorControlTester } from './lib/ErrorHandling/GoAErrorControl';
import GoACalloutControl, { GoACalloutControlTester } from './lib/Additional/GoACalloutControl';

export * from './lib/Context';
export * from './lib/common';
export * from './lib/Context/register';

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
  { tester: GoABooleanControlTester, renderer: GoABooleanControl },

  { tester: GoABooleanRadioControlTester, renderer: GoABooleanRadioControl },
  {
    tester: GoAArrayControlTester,
    renderer: GoAArrayControlRenderer,
  },
  {
    tester: GoAListWithDetailsTester,
    renderer: GoAArrayControlRenderer,
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
  {
    tester: ImageControlTester,
    renderer: ImageControl,
  },
];

export const GoARenderers: JsonFormsRendererRegistryEntry[] = [
  ...GoABaseRenderers,
  { tester: CategorizationRendererTester, renderer: FormStepperControl },
  { tester: FileUploaderTester, renderer: withJsonFormsControlProps(FileUploader) },
];

export const GoACells: JsonFormsCellRendererRegistryEntry[] = [...InputCells];
