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

  it('retains core instruction sections alongside examples', () => {
    const instructions = formGenerationAgent.instructions;
    // Workflow
    expect(instructions).toContain('## Workflow');
    expect(instructions).toContain('formConfigurationRetrievalTool');
    // Tool usage
    expect(instructions).toContain('Tool Usage');
    expect(instructions).toContain('formConfigurationUpdateTool');
    expect(instructions).toContain('schemaDefinitionTool');
    expect(instructions).toContain('fileDownloadTool');
    // Error handling
    expect(instructions).toContain('Error Handling');
    // Reference documentation
    expect(instructions).toContain('Reference Documentation');
    expect(instructions).toContain('cheat-sheet.html');
  });

  it('has the correct tools configured', () => {
    expect(formGenerationAgent.tools).toEqual([
      'schemaDefinitionTool',
      'formConfigurationRetrievalTool',
      'formConfigurationUpdateTool',
      'fileDownloadTool',
      'rendererCatalogTool',
    ]);
  });

  it('has the correct user roles', () => {
    expect(formGenerationAgent.userRoles).toEqual(['urn:ads:platform:configuration-service:configuration-admin']);
  });
});
