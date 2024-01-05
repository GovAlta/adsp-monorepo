import { JsonFormsCellRendererRegistryEntry, JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import {
  materialAllOfControlTester,
  MaterialAllOfRenderer,
  materialAnyOfControlTester,
  MaterialAnyOfRenderer,
  MaterialArrayControlRenderer,
  materialArrayControlTester,
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
  MaterialBooleanControl,
  materialBooleanControlTester,
  MaterialBooleanToggleControl,
  materialBooleanToggleControlTester,
  MaterialDateControl,
  materialDateControlTester,
  MaterialDateTimeControl,
  materialDateTimeControlTester,
  MaterialTimeControl,
  materialTimeControlTester,
  MaterialEnumControl,
  materialEnumControlTester,
  MaterialIntegerControl,
  materialIntegerControlTester,
  MaterialNativeControl,
  materialNativeControlTester,
  MaterialNumberControl,
  materialNumberControlTester,
  MaterialOneOfEnumControl,
  materialOneOfEnumControlTester,
  MaterialRadioGroupControl,
  materialRadioGroupControlTester,
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
  MaterialHorizontalLayout,
  materialHorizontalLayoutTester,
  MaterialVerticalLayout,
  materialVerticalLayoutTester,
} from '@jsonforms/material-renderers';
import {
  MaterialBooleanCell,
  materialBooleanCellTester,
  MaterialBooleanToggleCell,
  materialBooleanToggleCellTester,
  MaterialDateCell,
  materialDateCellTester,
  MaterialEnumCell,
  materialEnumCellTester,
  MaterialIntegerCell,
  materialIntegerCellTester,
  MaterialNumberCell,
  materialNumberCellTester,
  MaterialNumberFormatCell,
  materialNumberFormatCellTester,
  MaterialOneOfEnumCell,
  materialOneOfEnumCellTester,
  MaterialTimeCell,
  materialTimeCellTester,
} from '@jsonforms/material-renderers';
import {
  GoATextControlTester,
  GoAInputTextControl,
  CategorizationRendererTester,
  FormStepperControl,
  ArrayControlRenderer,
  ArrayControlTester,
} from './lib/Controls';
import { InputCells } from './lib/Cells';

export const GoABaseRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  {
    tester: ArrayControlTester,
    renderer: ArrayControlRenderer,
  },
  { tester: materialBooleanControlTester, renderer: MaterialBooleanControl },
  {
    tester: materialBooleanToggleControlTester,
    renderer: MaterialBooleanToggleControl,
  },
  { tester: materialNativeControlTester, renderer: MaterialNativeControl },
  { tester: materialEnumControlTester, renderer: MaterialEnumControl },
  { tester: materialIntegerControlTester, renderer: MaterialIntegerControl },
  { tester: materialNumberControlTester, renderer: MaterialNumberControl },
  { tester: GoATextControlTester, renderer: GoAInputTextControl },
  { tester: materialDateTimeControlTester, renderer: MaterialDateTimeControl },
  { tester: materialDateControlTester, renderer: MaterialDateControl },
  { tester: materialTimeControlTester, renderer: MaterialTimeControl },
  { tester: materialSliderControlTester, renderer: MaterialSliderControl },
  { tester: materialObjectControlTester, renderer: MaterialObjectRenderer },
  { tester: materialAllOfControlTester, renderer: MaterialAllOfRenderer },
  { tester: materialAnyOfControlTester, renderer: MaterialAnyOfRenderer },
  { tester: materialOneOfControlTester, renderer: MaterialOneOfRenderer },
  {
    tester: materialRadioGroupControlTester,
    renderer: MaterialRadioGroupControl,
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
  { tester: materialGroupTester, renderer: MaterialGroupLayout },
  {
    tester: materialHorizontalLayoutTester,
    renderer: MaterialHorizontalLayout,
  },
  { tester: materialVerticalLayoutTester, renderer: MaterialVerticalLayout },
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
];

export const GoARenderers: JsonFormsRendererRegistryEntry[] = [
  ...GoABaseRenderers,
  { tester: CategorizationRendererTester, renderer: FormStepperControl },
];

export const GoACells: JsonFormsCellRendererRegistryEntry[] = [
  { tester: materialBooleanCellTester, cell: MaterialBooleanCell },
  { tester: materialBooleanToggleCellTester, cell: MaterialBooleanToggleCell },
  { tester: materialDateCellTester, cell: MaterialDateCell },
  { tester: materialEnumCellTester, cell: MaterialEnumCell },
  { tester: materialIntegerCellTester, cell: MaterialIntegerCell },
  { tester: materialNumberCellTester, cell: MaterialNumberCell },
  { tester: materialNumberFormatCellTester, cell: MaterialNumberFormatCell },
  { tester: materialOneOfEnumCellTester, cell: MaterialOneOfEnumCell },
  { tester: materialTimeCellTester, cell: MaterialTimeCell },
  ...InputCells,
];
