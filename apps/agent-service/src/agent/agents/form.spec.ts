import { loadFormExamples } from './utils/loadFormExamples';

describe('loadFormExamples', () => {
  let result: string;

  beforeAll(() => {
    result = loadFormExamples();
  });

  it('returns a non-empty string', () => {
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  // --- Best Practices section ---
  describe('best practices', () => {
    it('includes best practices heading', () => {
      expect(result).toContain('# Best Practices');
    });

    it('includes layout selection guidance', () => {
      expect(result).toContain('## Layout Selection');
      expect(result).toContain('VerticalLayout');
      expect(result).toContain('Categorization');
    });

    it('includes validation checklist', () => {
      expect(result).toContain('## Validation Checklist');
      expect(result).toContain('#/properties/');
      expect(result).toContain('camelCase');
    });

    it('includes accessibility rules', () => {
      expect(result).toContain('## Accessibility');
      expect(result).toContain('help');
    });

    it('includes common fields guidance', () => {
      expect(result).toContain('## Common Fields');
      expect(result).toContain('adsp.alberta.ca/common.v1.schema.json');
    });

    it('includes iterative workflow steps', () => {
      expect(result).toContain('## Iterative Workflow');
      expect(result).toContain('formConfigurationRetrievalTool');
      expect(result).toContain('formConfigurationUpdateTool');
    });
  });

  // --- Control Examples ---
  describe('control examples', () => {
    it('includes UI Control Examples heading', () => {
      expect(result).toContain('# UI Control Examples');
    });

    it('includes text area example', () => {
      expect(result).toContain('## Text Area');
      expect(result).toContain('"multi": true');
    });

    it('includes inline help example', () => {
      expect(result).toContain('## Inline Help Content');
      expect(result).toContain('options.help');
    });

    it('includes file upload example', () => {
      expect(result).toContain('## File Upload');
      expect(result).toContain('file-urn');
    });
  });

  // --- Layout Examples ---
  describe('layout examples', () => {
    it('includes Layout Examples heading', () => {
      expect(result).toContain('# Layout Examples');
    });

    it('includes pages layout example with data and UI schema', () => {
      expect(result).toContain('## Multi-Page Form Layout');
      expect(result).toContain('"variant": "pages"');
      expect(result).toContain('Categorization');
      expect(result).toContain('Category');
    });

    it('includes vertical layout example', () => {
      expect(result).toContain('## Simple Vertical Layout');
      expect(result).toContain('VerticalLayout');
    });
  });

  // --- Common Field Examples ---
  describe('common field examples', () => {
    it('includes Common Field Examples heading', () => {
      expect(result).toContain('# Common Field Examples');
    });

    it('includes full name example with $ref', () => {
      expect(result).toContain('## Full Name (Common Field)');
      expect(result).toContain('common.v1.schema.json#/definitions/personFullName');
    });

    it('includes address example with $ref', () => {
      expect(result).toContain('## Address (Common Field)');
      expect(result).toContain('common.v1.schema.json#/definitions/postalAddressAlberta');
    });
  });

  // --- Content Element Examples ---
  describe('content element examples', () => {
    it('includes Content Element Examples heading', () => {
      expect(result).toContain('# Content Element Examples');
    });

    it('includes help content block example', () => {
      expect(result).toContain('## Help Content Block');
      expect(result).toContain('HelpContent');
      expect(result).toContain('"markdown": true');
    });
  });

  // --- Anti-Patterns ---
  describe('anti-patterns', () => {
    it('includes anti-patterns heading', () => {
      expect(result).toContain('# Anti-Patterns');
    });

    it('includes schema anti-patterns section', () => {
      expect(result).toContain('## Schema Anti-Patterns');
    });

    it('includes scope mismatch anti-pattern with bad/good examples', () => {
      expect(result).toContain('UI Schema Scope Mismatch');
      expect(result).toContain('**Bad:**');
      expect(result).toContain('**Good:**');
      expect(result).toContain('**Why:**');
    });

    it('includes missing scope prefix anti-pattern', () => {
      expect(result).toContain('Missing Scope Prefix');
    });

    it('includes non-camelCase properties anti-pattern', () => {
      expect(result).toContain('Non-camelCase Property Names');
      expect(result).toContain('first_name');
      expect(result).toContain('firstName');
    });

    it('includes formDefinitionId anti-pattern', () => {
      expect(result).toContain('Including formDefinitionId in Tool Input');
    });

    it('includes design anti-patterns section', () => {
      expect(result).toContain('## Design Anti-Patterns');
      expect(result).toContain('Too Many Fields on a Single Page');
      expect(result).toContain('No Help Text on Complex Fields');
    });
  });

  // --- Structure validation ---
  describe('output structure', () => {
    it('contains JSON code blocks for examples', () => {
      const jsonBlocks = result.match(/```json/g);
      expect(jsonBlocks).not.toBeNull();
      // Each example with schemas should have at least one json block
      // Controls (3) + layouts (2) + common-fields (2) + content (1) + anti-pattern bad/good pairs
      expect(jsonBlocks.length).toBeGreaterThanOrEqual(8);
    });

    it('all JSON code blocks are properly closed', () => {
      const openBlocks = (result.match(/```json/g) || []).length;
      const closeBlocks = (result.match(/```\n/g) || []).length;
      expect(closeBlocks).toBeGreaterThanOrEqual(openBlocks);
    });

    it('includes notes sections for examples', () => {
      const noteSections = result.match(/### Notes/g);
      expect(noteSections).not.toBeNull();
      expect(noteSections.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('formGenerationAgent', () => {
  // Import after loadFormExamples is available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { formGenerationAgent } = require('./form');

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
    expect(instructions).toContain(
      'NEVER call dataRegisterUpdateTool without first retrieving current values',
    );
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
      'formSchemaPatch',
      'schemaDefinitionTool',
      'formConfigurationRetrievalTool',
      'formConfigurationUpdateTool',
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
