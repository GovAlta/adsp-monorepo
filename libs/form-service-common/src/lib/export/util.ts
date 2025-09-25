import { FormDefinition } from '../store/form/model';
export const generateRandomNumber = (): number => {
  return Math.floor(10000 + Math.random() * 90000);
};

export const truncateString = (input: string, maxLength: number = 24): string => {
  return input?.length > maxLength ? input?.slice(0, maxLength) : input;
};

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

//eslint-disable-next-line
const structureToColumns = (structure: any, prefix: string = ''): ColumnOption[] => {
  const columns: ColumnOption[] = [];

  for (const key of Object.keys(structure)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (typeof structure[key] === 'object' && structure[key] !== null) {
      columns.push(...structureToColumns(structure[key], fullPath));
    } else {
      columns.push({
        id: fullPath,
        label: fullPath.replace(/\./g, ' '),
      });
    }
  }

  return columns;
};

type Item = { id: string; label: string };
//eslint-disable-next-line
export const transformToColumns = (def: FormDefinition, item: any): ColumnOption[] => {
  let standardProperties: Item[];
  if (def?.submissionRecords) {
    standardProperties = structureToColumns(formSubmissionStructure);
  } else {
    standardProperties = structureToColumns(formStructure);
  }

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
enum FormStatus {
  draft = 'Draft',
  submitted = 'Submitted',
  archived = 'Archived',
}

const formSubmissionStructure = {
  urn: 'string',
  id: 'string',
  formId: 'string',
  formDefinitionId: 'string',

  formFiles: 'string',
  created: 'string',
  createdBy: { id: 'string', name: 'string' },
  disposition: {
    id: 'string',
    status: 'string',
    reason: 'string',
    date: 'string',
  },
  updated: 'string',
  updatedBy: { id: 'string', name: 'string' },
  hash: 'string',
};

const formStructure = {
  urn: 'string',
  id: 'string',
  status: FormStatus,
  created: 'string',
  createdBy: {
    id: 'string',
    name: 'string',
  },
  submitted: 'string',
  lastAccessed: 'string',
  applicant: {
    addressAs: 'string',
  },

  formDraftUrl: 'string',
};
