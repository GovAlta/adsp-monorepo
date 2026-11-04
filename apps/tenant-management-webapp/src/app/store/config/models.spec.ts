import * as models from './models';

describe('config models', () => {
  it('initialises config state as an empty object', () => {
    expect(models.CONFIG_INIT).toEqual({});
  });

  it('does not expose a runtime export for the ConfigState type', () => {
    expect(models).not.toHaveProperty('ConfigState');
  });
});
