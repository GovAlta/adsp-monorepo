import { Monaco } from '@monaco-editor/react';
export const functionSuggestion = [
  {
    label: 'adsp.CreateTask',
    insertText: 'adsp.CreateTask',
  },
  {
    label: 'adsp.GeneratePdf',
    insertText: 'adsp.GeneratePdf',
  },
  {
    label: 'adsp.GetConfiguration',
    insertText: 'adsp.GetConfiguration',
  },
  {
    label: 'adsp.GetFormData',
    insertText: 'adsp.GetFormData',
  },
  {
    label: 'adsp.GetFormSubmission',
    insertText: 'adsp.GetFormSubmission',
  },
  {
    label: 'adsp.SendDomainEvent',
    insertText: 'adsp.SendDomainEvent',
  },
  {
    label: 'adsp.HttpGet',
    insertText: 'adsp.HttpGet',
  },
  {
    label: 'adsp.DispositionFormSubmission',
    insertText: 'adsp.DispositionFormSubmission',
  },
  {
    label: 'adsp.ReadValue',
    insertText: 'adsp.ReadValue',
  },
  {
    label: 'adsp.WriteValue',
    insertText: 'adsp.WriteValue',
  },
];

export const functionSignature = [
  {
    label:
      'adsp.CreateTask(string queueNamespace, string queueName, string name,string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null)',
    documentation: 'This function is used to create a task',
    parameters: [
      {
        label: 'queueNamespace',
        documentation: 'This is the queueNamespace',
      },
      {
        label: 'queueName',
        documentation: 'This is the queue name that for the task ',
      },
      {
        label: 'name',
        documentation: 'This is task name',
      },
      {
        label: 'description',
        documentation: 'This is task description, optional',
      },
      {
        label: 'recordId',
        documentation: 'This is task record identifier,optional',
      },
      {
        label: 'priority',
        documentation: 'This is task queue priority ,optional',
      },
      {
        label: 'context',
        documentation: 'This is task context ,optional',
      },
    ],
  },
  {
    label: 'adsp.GeneratePdf(string templateId, string filename, object values)',
    documentation: 'This function help GeneratePdf',
    parameters: [
      {
        label: 'templateId',
        documentation: 'This is the template ID',
      },
      {
        label: 'filename',
        documentation: 'This is the filename to generate the PDF file',
      },
      {
        label: 'values',
        documentation: 'This is key value inputs for the generated PDF file',
      },
    ],
  },
  {
    label: 'adsp.GetConfiguration(string @namespace, string name)',
    parameters: [
      {
        label: 'namespace',
        documentation: 'This is namespace input to get the configuration',
      },
      {
        label: 'name',
        documentation: 'This is the name to get the configuration',
      },
    ],
  },
  {
    label: 'adsp.GetFormData(string formId)',
    parameters: [
      {
        label: 'formId',
        documentation: 'This is the form ID',
      },
    ],
  },
  {
    label: 'adsp.GetFormSubmission(string formId, string submissionId)',
    parameters: [
      {
        label: 'formId',
        documentation: 'Form Id. Unique identifier for the form being queried.',
      },
      {
        label: 'submissionId',
        documentation: 'Submission Id. Used to identify existing submission being queried.',
      },
    ],
  },
  {
    label:
      'adsp.SendDomainEvent(string namespace, string name, string? correlationId, string? context = null, string? payload = {})',
    parameters: [
      {
        label: 'namespace',
        documentation: 'Namespace of event to send',
      },
      {
        label: 'name',
        documentation: 'Name of event to send',
      },
      {
        label: 'correlationId',
        documentation: 'correlationId of event',
      },
      {
        label: 'context',
        documentation: 'context of event',
      },
      {
        label: 'payload',
        documentation: 'nested dictionary to allow arbitrary json structure',
      },
    ],
  },
  {
    label: 'adsp.HttpGet(string url)',
    parameters: [
      {
        label: 'url',
        documentation: 'The url of the get request',
      },
    ],
  },
  {
    label:
      'adsp.DispositionFormSubmission(string formId, string submissionId, string dispositionStatus, string reason)',
    parameters: [
      {
        label: 'formId',
        documentation: 'Form Id. Unique identifier for the form to be dispositioned.',
      },
      {
        label: 'submissionId',
        documentation: 'Submission Id. Used to identify existing submission that disposition is to be set for.',
      },
      {
        label: 'dispositionState',
        documentation: 'The disposition state the form should be set to. For example: Accepted',
      },
      {
        label: 'reason',
        documentation: 'A string representing reason the form is to be set to this disposition state.',
      },
    ],
  },
  {
    label: 'adsp.ReadValue(string namespace, string name, string top, string after)',
    parameters: [
      {
        label: 'namespace',
        documentation: 'Namespace of the value to look up.',
      },
      {
        label: 'name',
        documentation: 'Name of the value to look up.',
      },
      {
        label: 'top',
        documentation: 'The number of records to look up',
      },
      {
        label: 'after',
        documentation: 'The records to to look up after.',
      },
    ],
  },
  {
    label: 'adsp.WriteValue(string namespace, string name, object value)',
    parameters: [
      {
        label: 'namespace',
        documentation: 'Namespace of the value.',
      },
      {
        label: 'name',
        documentation: 'Name of the value.',
      },
      {
        label: 'value',
        documentation: 'A key value object to save.',
      },
    ],
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractSuggestionsForSchema = (schema: any, monaco: Monaco) => {
  const suggestions = [];
  if (schema.properties) {
    for (const property in schema.properties) {
      if (
        typeof schema.properties[property]?.properties === 'object' &&
        schema.properties[property]?.properties !== null &&
        !Array.isArray(schema.properties[property].properties)
      ) {
        suggestions.push({
          label: property,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `'${property}'`,
          detail: 'Property',
          children: extractSuggestionsForSchema(schema.properties[property], monaco),
        });
      } else {
        suggestions.push({
          label: property,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `'${property}'`,
          detail: 'Property',
        });
      }
    }
  }

  return suggestions;
};

export const retrieveScriptSuggestions = (suggestion, model, position) => {
  const textUntilPosition = model.getValueInRange({
    startLineNumber: position.lineNumber,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });

  const matches = [...textUntilPosition.matchAll(/\['(\w+)'\]/g)];
  const lastElement = matches.length > 0 ? matches[matches.length - 1] : [];

  const matchName = lastElement !== null ? lastElement[1] : null;

  if (matchName !== null) {
    const matchSuggestions = findChildrenByLabel(suggestion, matchName);
    if (matchSuggestions && matchSuggestions.length > 0) {
      return matchSuggestions;
    }
    if (matchName && !matchSuggestions) {
      return [];
    }
  }

  return suggestion;
};

const findChildrenByLabel = (items, labelToFind) => {
  for (const item of items) {
    if (item.label === labelToFind) {
      return item.children || null;
    }
    if (item.children) {
      const result = findChildrenByLabel(item.children, labelToFind);
      if (result) return result;
    }
  }
  return null;
};
