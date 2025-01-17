import { FormDefinition } from '@store/form/model';
export interface ColumnOption {
  id: string;
  label: string;
  selected?: boolean;
  group?: 'Standard properties' | 'Form data';
}

//eslint-disable-next-line
export const jsonSchemaToColumns = (schema: any, prefix = 'formData'): ColumnOption[] => {
  const columns: ColumnOption[] = [];

  if (schema.type === 'object' && schema.properties) {
    for (const key in schema.properties) {
      //eslint-disable-next-line
      if (schema.properties.hasOwnProperty(key)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (schema.properties[key].type === 'object') {
          columns.push(...jsonSchemaToColumns(schema.properties[key], fullPath));
        } else {
          columns.push({
            id: fullPath,
            label: fullPath.replace(/\./g, ' '),
          });
        }
      }
    }
  }

  return columns;
};
type Item = { id: string; label: string };
//eslint-disable-next-line
export const transformToColumns = (def: FormDefinition, item: any): ColumnOption[] => {
  const standardProperties: Item[] = [
    { id: 'urn', label: 'URN' },
    { id: 'id', label: 'ID' },
    { id: 'created', label: 'Created' },
    { id: 'createdBy.name', label: 'Created By Name' },
    { id: 'createdBy.id', label: 'Created By ID' },
  ];
  const prefix: string = def?.submissionRecords ? 'formData' : 'data';
  const dataProperties = jsonSchemaToColumns(item, prefix);

  return [
    ...standardProperties.map((prop) => ({
      ...prop,
      selected: true,
      group: 'Standard properties' as const,
    })),
    ...dataProperties.map((prop) => ({
      ...prop,
      selected: true,
      group: 'Form data' as const,
    })),
  ];
};
