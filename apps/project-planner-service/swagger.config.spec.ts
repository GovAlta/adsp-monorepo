const swagger = jest.requireActual('./swagger.config');

describe('swagger.config', () => {
  it('declares an OpenAPI 3.0.0 document', () => {
    expect(swagger.openapi).toBe('3.0.0');
  });

  it('titles the API as the project planner service', () => {
    expect(swagger.info.title).toBe('Project planner service');
  });

  it('describes the planner purpose in the info description', () => {
    expect(swagger.info.description).toContain('Project Planner Service');
  });

  it.each(['Solution', 'Pattern', 'Specialist'])('declares the %s tag', (name) => {
    expect(swagger.tags.map((tag: { name: string }) => tag.name)).toContain(name);
  });

  it('defines a bearer JWT access token security scheme', () => {
    expect(swagger.components.securitySchemes.accessToken).toEqual({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  it('requires the access token security scheme by default', () => {
    expect(swagger.security).toEqual([{ accessToken: [] }]);
  });
});
