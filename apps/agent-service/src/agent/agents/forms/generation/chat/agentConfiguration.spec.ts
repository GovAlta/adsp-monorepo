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

  it('embeds control examples in instructions', () => {
    expect(formGenerationAgent.instructions).toContain('Text Area');
    expect(formGenerationAgent.instructions).toContain('Inline Help');
    expect(formGenerationAgent.instructions).toContain('File Upload');
    expect(formGenerationAgent.instructions).toContain('Multi-Select Checkboxes');
  });

  it('embeds document use-case mapping so other form types can be matched from a requirements document', () => {
    expect(formGenerationAgent.instructions).toContain('Document use cases');
    expect(formGenerationAgent.instructions).toContain('Government application (permits, licenses, benefits)');
    expect(formGenerationAgent.instructions).toContain('Vendor or program registration');
    expect(formGenerationAgent.instructions).toContain('Eligibility calculator or computed totals');
    expect(formGenerationAgent.instructions).toContain('### When to use');
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
    expect(instructions).toContain('data-register');
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
