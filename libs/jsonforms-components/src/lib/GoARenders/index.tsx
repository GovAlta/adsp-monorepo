import { materialRenderers } from '@jsonforms/material-renderers';
import { GoATextControlTester, GoAInputTextControl } from '../Controls';
export const GoAInputRenderers = [{ tester: GoATextControlTester, renderer: GoAInputTextControl }];

export const GoARenderers = [
  //register custom renderers
  ...GoAInputRenderers,
];
