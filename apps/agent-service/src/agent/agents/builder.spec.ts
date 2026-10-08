import {
  builderAgent,
  builderPreviewReliabilityAgent,
  builderPrototypeCoderAgent,
  builderWorkspaceAnalystAgent,
} from './builder';

describe('builder agents', () => {
  // Sub-agents see only their own instructions, so each agent that edits forms needs the authoring rules itself.
  it.each([
    ['builderAgent', builderAgent],
    ['builderPrototypeCoderAgent', builderPrototypeCoderAgent],
  ])('%s has the JSON form authoring rules and tools', (_name, agent) => {
    expect(agent.instructions).toContain('## Forms and Data Collection');
    expect(agent.instructions).toContain('builderFormSchemaValidate');
    expect(agent.tools).toEqual(
      expect.arrayContaining([
        'builderFormSchemaValidate',
        'formExamplesTool',
        'rendererCatalogTool',
        'schemaDefinitionTool',
      ]),
    );
  });

  it('lets the preview reliability agent validate form definitions', () => {
    expect(builderPreviewReliabilityAgent.tools).toContain('builderFormSchemaValidate');
  });

  it('asks the analyst to report how forms are rendered', () => {
    expect(builderWorkspaceAnalystAgent.instructions).toContain('form definition');
  });
});
