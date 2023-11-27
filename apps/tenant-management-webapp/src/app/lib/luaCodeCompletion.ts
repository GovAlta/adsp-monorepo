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
    label: 'adsp.SendDomainEvent',
    insertText: 'adsp.SendDomainEvent',
  },
  {
    label: 'adsp.HttpGet',
    insertText: 'adsp.HttpGet',
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
];
