import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { DATA_REGISTER_NAMESPACE } from './model';

export const selectRegisterData = createSelector(
  (state: RootState) => state,
  (state) => {
    return state?.configuration?.registers;
  }
);

const selectTenantConfigDefinitions = (state: RootState) => state.configuration?.tenantConfigDefinitions;
const selectRegisters = (state: RootState) => state.configuration?.registers;

// A definition is a "data list" the jsonforms register renderers can resolve by URN: an array whose items are
// plain strings or objects (as opposed to an anyOf of the two, which is how data registers declare their schema).
const isDataListDefinition = (config: unknown): boolean => {
  const schema = (config as { configurationSchema?: { type?: string; items?: { type?: string } } })
    ?.configurationSchema;
  return schema?.type === 'array' && (schema.items?.type === 'string' || schema.items?.type === 'object');
};

const getDataListDefinitionEntries = (
  tenantConfigDefinitions: RootState['configuration']['tenantConfigDefinitions'],
): [string, unknown][] =>
  Object.entries(tenantConfigDefinitions?.configuration || {}).filter(([, config]) => isDataListDefinition(config));

const getRegisterNameFromUrn = (urn: string): string => {
  const parts = urn.split('/');
  return parts[parts.length - 1] ?? '';
};

// The union of definitions that look like a data list (today's rule) and the data registers already loaded into
// state. A data register's definition schema is an anyOf of string/object, which isDataListDefinition does not
// match, so without this union a register would falsely read as "does not exist" until the Configuration page
// happened to be visited and its definition reloaded.
export const selectRegisterDataList = createSelector(
  selectTenantConfigDefinitions,
  selectRegisters,
  (tenantConfigDefinitions, registers) => {
    const definitionNames = getDataListDefinitionEntries(tenantConfigDefinitions).map(([name]) =>
      name.replace(':', '/'),
    );
    const registerNames = (registers ?? []).map(
      (register) => `${DATA_REGISTER_NAMESPACE}/${getRegisterNameFromUrn(register.urn ?? '')}`,
    );

    return Array.from(new Set([...definitionNames, ...registerNames]));
  },
);

export const selectNonAnonymousDataList = createSelector(selectTenantConfigDefinitions, (tenantConfigDefinitions) =>
  getDataListDefinitionEntries(tenantConfigDefinitions)
    .filter(([, config]) => (config as { anonymousRead?: boolean })?.anonymousRead !== true)
    .map(([name]) => name.replace(':', '/')),
);
