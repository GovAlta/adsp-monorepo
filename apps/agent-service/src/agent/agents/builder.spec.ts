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

  // Sub-agents see only their own instructions, so each agent that writes code needs the platform request rules.
  it.each([
    ['builderAgent', builderAgent],
    ['builderPrototypeCoderAgent', builderPrototypeCoderAgent],
  ])('%s knows how to make platform requests through the token handler', (_name, agent) => {
    expect(agent.instructions).toContain('## Platform Services and API Requests');
    expect(agent.instructions).toContain('/token-handler/targets/');
    expect(agent.instructions).toContain('apiFetch');
    expect(agent.instructions).toContain('CSRF');
    expect(agent.instructions).toContain('form-service');
    expect(agent.instructions).toContain('file-service');
  });

  it('asks the analyst to report whether the project uses the token handler', () => {
    expect(builderWorkspaceAnalystAgent.instructions).toContain('token handler');
  });
});
