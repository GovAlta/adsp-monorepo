jest.mock('react-markdown', () => ({ __esModule: true, default: () => null }));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => null }));

import * as appCommon from './index';

describe('app-common barrel', () => {
  it('re-exports the shared components', () => {
    expect(appCommon.AuthCallback).toBeDefined();
    expect(appCommon.Band).toBeDefined();
    expect(appCommon.Container).toBeDefined();
    expect(appCommon.Footer).toBeDefined();
  });
});
