import { ValidationError } from '../state';

const ALLOWED_VALUES_MESSAGE = 'should be equal to one of the allowed values';

/**
 * Normalizes the validation errors reported by a form change before they reach the store.
 *
 * Dropdowns whose enum is populated at runtime (see populateDropdown) report an allowed-values
 * error against the placeholder enum, which is not a real error for the user. Those changes are
 * reported as no errors at all.
 *
 * `errors` is optional: DraftForm's auto-populate effect calls onChange with data only, so this
 * must tolerate undefined rather than indexing into it.
 */
export const resolveFormChangeErrors = (errors?: ValidationError[]): ValidationError[] | null => {
  const [firstError] = errors ?? [];

  const isPopulatedEnumError =
    firstError?.message === ALLOWED_VALUES_MESSAGE && Boolean(firstError?.schemaPath?.includes('enum'));

  return isPopulatedEnumError ? null : errors;
};
