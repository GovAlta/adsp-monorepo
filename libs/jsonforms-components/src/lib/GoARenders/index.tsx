import { vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { GoAInputRenderers } from './InputRender';
import { GoAFormStepperRenderer } from './FormStepperRender';

export const GoARenderers = [
  //register custom renderers
  ...vanillaRenderers,
  ...GoAInputRenderers,
  ...GoAFormStepperRenderer,
];
