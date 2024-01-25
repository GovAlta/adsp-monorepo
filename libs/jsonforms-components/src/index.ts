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
  materialEnumControlTester,
  MaterialOneOfEnumControl,
  MaterialSliderControl,
  materialSliderControlTester,
  MaterialOneOfRadioGroupControl,
  materialOneOfRadioGroupControlTester,
} from '@jsonforms/material-renderers';
import {
  MaterialArrayLayout,
  materialArrayLayoutTester,
  MaterialCategorizationLayout,
  materialCategorizationTester,
  MaterialGroupLayout,
  materialGroupTester,
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
  MultiLineTextControl,
  MultiLineTextControlTester,
  GoAEnumControl,
  GoAEnumControlTester,
  GoAEnumRadioGroupControl,
  GoARadioGroupControlTester,
  GoAArrayControlTester,
  GoAArrayControlRenderer,
} from './lib/Controls';
import { InputCells } from './lib/Cells';
import { GoAVerticalLayout, GoAHorizontalLayout } from './lib/layouts';

import { FileUploaderWrapper } from './lib/Controls/FileUploader/FileUploaderWrapper';

export class Renderers {
  GoARenderers: JsonFormsRendererRegistryEntry[];
  constructor(uploadTrigger?: (file: File) => void, downloadTrigger?: (file: File) => void, latestFile?: unknown) {
    this.GoARenderers = [
      ...this.GoABaseRenderers,
      { tester: CategorizationRendererTester, renderer: FormStepperControl },
      {
        tester: FileUploaderTester,
        renderer: FileUploaderWrapper({ uploadTrigger, downloadTrigger, latestFile }),
      },
    ];
  }

  GoABaseRenderers: JsonFormsRendererRegistryEntry[] = [
    // controls
    { tester: GoAEnumControlTester, renderer: GoAEnumControl },
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
    {
      tester: GoAArrayControlTester,
      renderer: GoAArrayControlRenderer,
    },
    {
      tester: materialOneOfRadioGroupControlTester,
      renderer: MaterialOneOfRadioGroupControl,
    },
    {
      tester: materialEnumControlTester,
      renderer: MaterialOneOfEnumControl,
    },
    // layouts
    { tester: materialGroupTester, renderer: MaterialGroupLayout },
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
  ];

  GoACells: JsonFormsCellRendererRegistryEntry[] = [
    { tester: materialBooleanCellTester, cell: MaterialBooleanCell },
    { tester: materialBooleanToggleCellTester, cell: MaterialBooleanToggleCell },
    { tester: materialEnumCellTester, cell: MaterialEnumCell },
    { tester: materialOneOfEnumCellTester, cell: MaterialOneOfEnumCell },
    ...InputCells,
  ];
}
