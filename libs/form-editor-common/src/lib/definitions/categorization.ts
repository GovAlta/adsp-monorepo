// clean-code-ignore: RULE-19 — re-export only; the template it forwards is covered by its consumers.
// Moved to @core-services/app-common so applications can use the template without depending on
// this library. Re-exported under the original names for existing consumers.
export {
  defaultMultiPageFormSchema as schema,
  defaultMultiPageFormUiSchema as uischema,
  defaultMultiPageFormData as data,
} from '@core-services/app-common';
