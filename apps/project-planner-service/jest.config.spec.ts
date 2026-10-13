import config from './jest.config';

describe('jest.config', () => {
  it('uses the coverage preset shared across the workspace', () => {
    expect(config.preset).toBe('../../jest-cover.preset.js');
  });

  it('identifies the project by its display name', () => {
    expect(config.displayName).toBe('project-planner-service');
  });

  it('runs tests in a node environment', () => {
    expect(config.testEnvironment).toBe('node');
  });

  it('writes coverage to the project folder under the workspace coverage directory', () => {
    expect(config.coverageDirectory).toBe('../../coverage/apps/project-planner-service');
  });

  it('compiles ts and js files with ts-jest using the spec tsconfig', () => {
    expect(config.transform['^.+\\.[tj]s$']).toEqual(['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]);
  });

  it('resolves ts, js and html module extensions', () => {
    expect(config.moduleFileExtensions).toEqual(['ts', 'js', 'html']);
  });
});
