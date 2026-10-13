const mockExtend = jest.fn();

jest.mock('@nx/webpack', () => ({
  withNx: jest.fn(() => 'nx-plugin'),
  composePlugins: jest.fn((...plugins: unknown[]) => plugins),
}));
jest.mock('./webpack.config.old.js', () => mockExtend);

describe('webpack.config', () => {
  const loadPlugins = () => jest.requireActual('./webpack.config') as [string, (config: unknown, ctx: unknown) => unknown];

  afterEach(() => {
    mockExtend.mockReset();
  });

  it('composes the Nx plugin first', () => {
    const [nxPlugin] = loadPlugins();

    expect(nxPlugin).toBe('nx-plugin');
  });

  it('delegates configuration to the swagger config extension with the build context', () => {
    const [, customize] = loadPlugins();
    const baseConfig = { plugins: [] };
    const context = { projectName: 'project-planner-service' };
    mockExtend.mockReturnValue({ extended: true });

    const result = customize(baseConfig, { options: {}, context });

    expect(mockExtend).toHaveBeenCalledWith(baseConfig, context);
    expect(result).toEqual({ extended: true });
  });
});
