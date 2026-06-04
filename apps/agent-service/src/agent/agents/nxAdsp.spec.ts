import { nxAdspAgent } from './nxAdsp';

describe('nxAdspAgent', () => {
  it('has a name and description', () => {
    expect(nxAdspAgent.name).toBeTruthy();
    expect(nxAdspAgent.description).toBeTruthy();
  });

  it('has instructions', () => {
    expect(nxAdspAgent.instructions).toBeTruthy();
    expect(typeof nxAdspAgent.instructions).toBe('string');
    expect((nxAdspAgent.instructions as string).length).toBeGreaterThan(0);
  });

  it('has workspace enabled', () => {
    expect(nxAdspAgent.workspace?.enabled).toBe(true);
  });

  it('references the nx-adsp template tools', () => {
    expect(nxAdspAgent.tools).toContain('listNxAdspTemplatesTool');
    expect(nxAdspAgent.tools).toContain('getNxAdspTemplateTool');
  });

  it('has userRoles defined', () => {
    expect(nxAdspAgent.userRoles).toBeDefined();
    expect(nxAdspAgent.userRoles?.length).toBeGreaterThan(0);
  });
});
