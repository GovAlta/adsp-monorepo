import { JsonFormsCellRendererRegistryEntry, JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import {
  materialAllOfControlTester,
  MaterialAllOfRenderer,
  materialAnyOfControlTester,
  MaterialAnyOfRenderer,
  materialObjectControlTester,
  MaterialObjectRenderer,
  materialOneOfControlTester,
  MaterialOneOfRenderer,
  MaterialEnumArrayRenderer,
  materialEnumArrayRendererTester,
} from '@jsonforms/material-renderers';
import {
  MaterialAnyOfStringOrEnumControl,
  materialAnyOfStringOrEnumControlTester,
  MaterialOneOfEnumControl,
  MaterialSliderControl,
  materialSliderControlTester,
  MaterialOneOfRadioGroupControl,
  materialOneOfRadioGroupControlTester,
  materialOneOfEnumControlTester,
} from '@jsonforms/material-renderers';
import {
  MaterialArrayLayout,
  materialArrayLayoutTester,
  materialHorizontalLayoutTester,
  materialVerticalLayoutTester,
} from '@jsonforms/material-renderers';
import {
  MaterialBooleanCell,
  materialBooleanCellTester,
  MaterialBooleanToggleCell,
  materialBooleanToggleCellTester,
  MaterialEnumCell,
  materialEnumCellTester,
  MaterialOneOfEnumCell,
  materialOneOfEnumCellTester,
} from '@jsonforms/material-renderers';
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
  GoAEnumAutoCompleteControl,
  GoAEnumControlTester,
  GoAEnumControlAutoCompleteTester,
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
import { GoAVerticalLayout, GoAHorizontalLayout, GoAGroupLayoutTester, GoAGroupControl } from './lib/layouts';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { addData } from './lib/Context';

import { HelpContent, HelpContentTester } from './lib/Additional';
import GoAErrorControl, { GoAErrorControlTester } from './lib/ErrorHandling/GoAErrorControl';
import GoACalloutControl, { GoACalloutControlTester } from './lib/Additional/GoACalloutControl';

export * from './lib/Context';
export * from './lib/common/Ajv';
const countries = ['Argentina', 'Brazil', 'Canada', 'Denmark', 'Egypt', 'France', 'Greece', 'India', 'Japan', 'Kenya'];
addData('countries', countries);
export const GoABaseRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  { tester: GoAEnumControlTester, renderer: GoAEnumControl },
  { tester: GoAEnumControlAutoCompleteTester, renderer: GoAEnumAutoCompleteControl },
  { tester: GoAIntegerControlTester, renderer: GoAInputIntegerControl },
  { tester: GoANumberControlTester, renderer: GoAInputNumberControl },
  { tester: GoATextControlTester, renderer: GoAInputTextControl },
  { tester: GoADateControlTester, renderer: GoAInputDateControl },
  { tester: GoADateTimeControlTester, renderer: GoAInputDateTimeControl },
  { tester: GoATimeControlTester, renderer: GoAInputTimeControl },
  { tester: GoACalloutControlTester, renderer: GoACalloutControl },
  { tester: materialSliderControlTester, renderer: MaterialSliderControl },
  { tester: materialObjectControlTester, renderer: MaterialObjectRenderer },
  { tester: materialAllOfControlTester, renderer: MaterialAllOfRenderer },
  { tester: materialAnyOfControlTester, renderer: MaterialAnyOfRenderer },
  { tester: materialOneOfControlTester, renderer: MaterialOneOfRenderer },
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
  {
    tester: materialOneOfRadioGroupControlTester,
    renderer: MaterialOneOfRadioGroupControl,
  },
  {
    tester: materialOneOfEnumControlTester,
    renderer: MaterialOneOfEnumControl,
  },
  // layouts
  { tester: GoAGroupLayoutTester, renderer: GoAGroupControl },
  {
    tester: materialHorizontalLayoutTester,
    renderer: GoAHorizontalLayout,
  },
  { tester: materialVerticalLayoutTester, renderer: GoAVerticalLayout },
  { tester: materialArrayLayoutTester, renderer: MaterialArrayLayout },
  // additional
  { tester: GoAErrorControlTester, renderer: GoAErrorControl },
  {
    tester: materialAnyOfStringOrEnumControlTester,
    renderer: MaterialAnyOfStringOrEnumControl,
  },
  {
    tester: materialEnumArrayRendererTester,
    renderer: MaterialEnumArrayRenderer,
  },
  {
    tester: materialEnumArrayRendererTester,
    renderer: MaterialEnumArrayRenderer,
  },
  {
    tester: MultiLineTextControlTester,
    renderer: MultiLineTextControl,
  },
  {
    tester: HelpContentTester,
    renderer: HelpContent,
  },
];

export const GoARenderers: JsonFormsRendererRegistryEntry[] = [
  ...GoABaseRenderers,
  { tester: CategorizationRendererTester, renderer: FormStepperControl },
  { tester: FileUploaderTester, renderer: withJsonFormsControlProps(FileUploader) },
];

export const GoACells: JsonFormsCellRendererRegistryEntry[] = [
  { tester: materialBooleanCellTester, cell: MaterialBooleanCell },
  { tester: materialBooleanToggleCellTester, cell: MaterialBooleanToggleCell },
  { tester: materialEnumCellTester, cell: MaterialEnumCell },
  { tester: materialOneOfEnumCellTester, cell: MaterialOneOfEnumCell },
  ...InputCells,
];
