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
  MaterialLabelRenderer,
  materialLabelRendererTester,
  MaterialListWithDetailRenderer,
  materialListWithDetailTester,
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
  MaterialCategorizationLayout,
  materialCategorizationTester,
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
import { GoAVerticalLayout, GoAHorizontalLayout, groupLayoutTester } from './lib/layouts';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { JsonFormContextInstance } from './lib/Context';
import { HelpContent, HelpContentTester } from './lib/Additional';
import GroupControl from './lib/layouts/GroupControl';

export * from './lib/Context';

const countries = ['Argentina', 'Brazil', 'Canada', 'Denmark', 'Egypt', 'France', 'Greece', 'India', 'Japan', 'Kenya'];

JsonFormContextInstance.addData('countries', countries);

export class Renderers {
  GoARenderers: JsonFormsRendererRegistryEntry[];
  constructor() {
    this.GoARenderers = [
      ...this.GoABaseRenderers,
      { tester: CategorizationRendererTester, renderer: FormStepperControl },
      { tester: FileUploaderTester, renderer: withJsonFormsControlProps(FileUploader) },
    ];
  }

  GoABaseRenderers: JsonFormsRendererRegistryEntry[] = [
    // controls
    { tester: GoAEnumControlTester, renderer: GoAEnumControl },
    { tester: GoAEnumControlAutoCompleteTester, renderer: GoAEnumAutoCompleteControl },
    { tester: GoAIntegerControlTester, renderer: GoAInputIntegerControl },
    { tester: GoANumberControlTester, renderer: GoAInputNumberControl },
    { tester: GoATextControlTester, renderer: GoAInputTextControl },
    { tester: GoADateControlTester, renderer: GoAInputDateControl },
    { tester: GoADateTimeControlTester, renderer: GoAInputDateTimeControl },
    { tester: GoATimeControlTester, renderer: GoAInputTimeControl },
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
    { tester: groupLayoutTester, renderer: GroupControl },
    {
      tester: materialHorizontalLayoutTester,
      renderer: GoAHorizontalLayout,
    },
    { tester: materialVerticalLayoutTester, renderer: GoAVerticalLayout },
    {
      tester: materialCategorizationTester,
      renderer: MaterialCategorizationLayout,
    },
    { tester: materialArrayLayoutTester, renderer: MaterialArrayLayout },
    // additional
    { tester: materialLabelRendererTester, renderer: MaterialLabelRenderer },
    {
      tester: materialListWithDetailTester,
      renderer: MaterialListWithDetailRenderer,
    },
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

  GoACells: JsonFormsCellRendererRegistryEntry[] = [
    { tester: materialBooleanCellTester, cell: MaterialBooleanCell },
    { tester: materialBooleanToggleCellTester, cell: MaterialBooleanToggleCell },
    { tester: materialEnumCellTester, cell: MaterialEnumCell },
    { tester: materialOneOfEnumCellTester, cell: MaterialOneOfEnumCell },
    ...InputCells,
  ];
}
