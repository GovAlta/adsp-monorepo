import { FormDefinition } from './form';

export function isFormDefinition(value: unknown): value is FormDefinition {
  return typeof (value as FormDefinition)?.anonymousApply === 'boolean';
}
