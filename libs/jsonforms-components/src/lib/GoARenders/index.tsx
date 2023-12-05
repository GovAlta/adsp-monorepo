import { vanillaRenderers } from '@jsonforms/vanilla-renderers';
import { GoAInputRenderers } from './InputRender';

export const GoARenderers = [
  //register custom renderers
  ...vanillaRenderers,
  ...GoAInputRenderers,
];
