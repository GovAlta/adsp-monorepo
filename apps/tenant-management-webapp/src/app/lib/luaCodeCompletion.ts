export const functionSuggestion = [
  {
    label: 'CreateTask',
    insertText: 'CreateTask',
  },
  {
    label: 'GeneratePdf',
    insertText: 'GeneratePdf',
  },
  {
    label: 'GetConfiguration',
    insertText: 'GetConfiguration',
  },
  {
    label: 'GetFormData',
    insertText: 'GetFormData',
  },
];

export const functionSignature = [
  {
    label:
      'CreateTask(string queueNamespace, string queueName, string name,string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null)',
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
    label: 'GeneratePdf(string templateId, string filename, object values)',
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
    label: 'GetConfiguration(string @namespace, string name)',
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
    label: 'GetFormData(string formId)',
    parameters: [
      {
        label: 'formId',
        documentation: 'This is the form ID',
      },
    ],
  },
];
