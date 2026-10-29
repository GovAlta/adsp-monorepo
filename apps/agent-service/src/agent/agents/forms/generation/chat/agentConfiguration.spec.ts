import { formGenerationAgent } from './agentConfiguration';

describe('formGenerationAgent', () => {
  it('has instructions that include loaded examples', () => {
    const instructions = formGenerationAgent.instructions;
    expect(typeof instructions).toBe('string');
    expect(instructions.length).toBeGreaterThan(0);
  });

  it('embeds best practices in instructions', () => {
    expect(formGenerationAgent.instructions).toContain('Best Practices');
    expect(formGenerationAgent.instructions).toContain('Layout Selection');
  });

  it('leaves the worked examples other than data registers out of the instructions', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).not.toContain('# UI Control Examples');
    expect(instructions).not.toContain('# Computed Field Examples');
    expect(instructions).not.toContain('# Rule Examples');
    // Every model call re-sends the instructions; with the worked examples inline they were over 130k characters.
    expect(instructions.length).toBeLessThan(60000);
  });

  it('keeps the data register examples in the instructions', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('# Data Register Examples');
    expect(instructions).toContain('Data Register — Object Array with Label/Value Mapping');
    expect(instructions).toContain('Data Register — Weekdays (String Array)');
  });

  it('instructs to read a register before wiring it and to map object entries by their exact keys', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain(
      'Before wiring an existing register, call dataRegisterGetTool to see its entries. Never guess their shape.',
    );
    expect(instructions).toContain('next to\n  options.register (not inside it)');
    expect(instructions).toContain('"label": "ministryName", "value": "ministryCode"');
  });

  it('instructs to ask for the document again when the build request has none attached', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('formGenerationRun reads only the documents attached to the user\'s current message.');
    expect(instructions).toContain('Do not call formGenerationRun without it.');
  });

  it('instructs to load worked examples on demand with formExamplesTool', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('call formExamplesTool for worked examples. Request only the groups you need.');
    expect(instructions).toContain('formExamplesTool:             must include groups');
    expect(instructions).toContain('load the rules examples with formExamplesTool');
  });

  it('embeds document use-case mapping so other form types can be matched from a requirements document', () => {
    expect(formGenerationAgent.instructions).toContain('Document use cases');
    expect(formGenerationAgent.instructions).toContain('Government application (permits, licenses, benefits)');
    expect(formGenerationAgent.instructions).toContain('Vendor or program registration');
    expect(formGenerationAgent.instructions).toContain('Eligibility calculator or computed totals');
  });

  it('embeds layout examples in instructions', () => {
    expect(formGenerationAgent.instructions).toContain('Multi-Page Form Layout');
    expect(formGenerationAgent.instructions).toContain('Simple Vertical Layout');
  });

  it('embeds common field examples in instructions', () => {
    expect(formGenerationAgent.instructions).toContain('Full Name (Common Field)');
    expect(formGenerationAgent.instructions).toContain('Address (Common Field)');
  });

  it('embeds anti-patterns in instructions', () => {
    expect(formGenerationAgent.instructions).toContain('Anti-Patterns');
    expect(formGenerationAgent.instructions).toContain('Scope Mismatch');
  });

  it('includes HelpContent behavioral rules section', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('## HelpContent Rules');
  });

  it('instructs to default to markdown true for HelpContent', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('ALWAYS set');
    expect(instructions).toContain('"markdown": true');
    expect(instructions).toContain('unless the user requests otherwise');
  });

  it('instructs to offer help text when adding new fields', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('When adding a new field, briefly ask if they want help text');
  });

  it('instructs to consolidate adjacent HelpContent elements', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('Check for adjacent HelpContent elements after any uiSchema update');
    expect(instructions).toContain('offer to consolidate');
  });

  it('instructs to clean up HelpContent when deleting controls', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('When removing a Control, check for adjacent HelpContent');
    expect(instructions).toContain('ask whether to remove it too');
  });

  it('includes Data Registers behavioral section', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('## Data Registers');
    expect(instructions).toContain('Wiring a register into a form');
  });

  it('instructs to suggest data registers for reusable dropdown values', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('Data registers are a non-standard ADSP extension');
    expect(instructions).toContain('shared across forms');
  });

  it('instructs to check existing registers before creating a new one', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('dataRegisterListTool');
    expect(instructions).toContain('Check for existing registers with similar names');
  });

  it('documents label/value mapping for object registers', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('options.label');
    expect(instructions).toContain('options.value');
  });

  it('instructs to collect register values from user before calling any tools', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('Creating a new register (MANDATORY flow)');
    expect(instructions).toContain('NEVER guess or infer register values');
    expect(instructions).toContain('simple list (label = value)');
    expect(instructions).toContain('label/value pairs');
  });

  it('describes both register data formats', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('simple list (label = value)');
    expect(instructions).toContain('label/value pairs');
  });

  it('instructs to confirm register details before creating', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('Does this look right');
    expect(instructions).toContain('wire it into your form');
  });

  it('instructs never to guess register values', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('NEVER guess or infer register values');
  });

  it('includes data register tool input requirements', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('dataRegisterCreateTool');
    expect(instructions).toContain('dataRegisterGetTool');
    expect(instructions).toContain('dataRegisterUpdateTool');
    expect(instructions).toContain('must include name and data');
  });

  it('instructs to switch to the update flow or another name when a register already exists', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('Create never overwrites');
    expect(instructions).toContain('do not retry the create');
    expect(instructions).toContain('get → confirm → update');
  });

  it('instructs to report a missing register rather than an empty list', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('tell the user it was not found. Do not present an empty list.');
    expect(instructions).toContain('nothing was created: tell the user it was not found.');
  });

  it('states the register name rules and suggests kebab-case', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain(
      'Register names: 1–50 letters, numbers, spaces, hyphens or underscores, not starting or ending with a space.',
    );
    expect(instructions).toContain('Suggest kebab-case');
  });

  it('instructs to ask the user to reconnect when the session has expired', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('tell the user to reconnect and try again');
  });

  it('instructs to retrieve current values and confirm before updating registers', () => {
    const instructions = formGenerationAgent.instructions;
    expect(instructions).toContain('Updating an existing register (MANDATORY flow)');
    expect(instructions).toContain('dataRegisterGetTool');
    expect(instructions).toContain('Does this look right');
    expect(instructions).toContain('NEVER call dataRegisterUpdateTool without first retrieving current values');
  });

  it('retains core instruction sections alongside examples', () => {
    const instructions = formGenerationAgent.instructions;
    // Session workflow
    expect(instructions).toContain('## Session start');
    expect(instructions).toContain('formConfigurationRetrievalTool');
    // Tool required inputs
    expect(instructions).toContain('## Tool required inputs');
    expect(instructions).toContain('formConfigurationUpdateTool');
    expect(instructions).toContain('schemaDefinitionTool');
    expect(instructions).toContain('fileDownloadTool');
    // Error handling
    expect(instructions).toContain('Error Handling');
    // Reference documentation
    expect(instructions).toContain('Reference Documentation');
    expect(instructions).toContain('cheat-sheet.html');
  });

  // --- CS-4960: preserving the existing form definition ---
  describe('preserving the existing form definition (CS-4960)', () => {
    it('includes the schema integrity constraints section', () => {
      const instructions = formGenerationAgent.instructions;
      expect(instructions).toContain('Schema integrity');
    });

    it('explains that the update tool REPLACES rather than merging', () => {
      const instructions = formGenerationAgent.instructions;
      expect(instructions).toContain('NEVER send only new or changed fields to formConfigurationUpdateTool');
      expect(instructions).toContain('it REPLACES, not merges');
    });

    it('instructs never to delete existing content unless explicitly asked', () => {
      const instructions = formGenerationAgent.instructions;
      expect(instructions).toContain(
        'NEVER delete or remove any existing field, property, UI element, validation, rule, or help content unless the user EXPLICITLY asks you to remove it.',
      );
    });

    it('instructs never to completely rewrite or replace an existing schema unless explicitly asked', () => {
      const instructions = formGenerationAgent.instructions;
      expect(instructions).toContain('NEVER completely rewrite or replace an existing schema.');
      expect(instructions).toContain('explicitly asks to start over');
    });

    it('instructs never to change the name of the form definition', () => {
      const instructions = formGenerationAgent.instructions;
      expect(instructions).toContain('NEVER change the name of the form definition.');
    });

    it('instructs never to create a new form definition', () => {
      const instructions = formGenerationAgent.instructions;
      expect(instructions).toContain('NEVER create a new form definition.');
    });
  });

  it('has the correct tools configured', () => {
    expect(formGenerationAgent.tools).toEqual([
      'formSchemaIndex',
      'formGenerationRun',
      'formSchemaValidate',
      'formSchemaPatch',
      'schemaDefinitionTool',
      'fileDownloadTool',
      'documentExtractTool',
      'rendererCatalogTool',
      'formExamplesTool',
      'dataRegisterListTool',
      'dataRegisterCreateTool',
      'dataRegisterGetTool',
      'dataRegisterUpdateTool',
    ]);
  });

  it('has the correct user roles', () => {
    expect(formGenerationAgent.userRoles).toEqual(['urn:ads:platform:configuration-service:configuration-admin']);
  });
});
