import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  AdspCapabilityProvider,
  resolveCapability,
  useCapability,
  type AdspCapabilityRoleMap,
} from './adsp-capability-provider';

const capabilities: AdspCapabilityRoleMap = { 'file.download': ['reader'], 'file.upload': ['writer'] };

const wrapper =
  (roles: string[], map?: AdspCapabilityRoleMap) =>
  ({ children }: { children: ReactNode }) => (
    <AdspCapabilityProvider roles={roles} capabilities={map}>
      {children}
    </AdspCapabilityProvider>
  );

describe('resolveCapability', () => {
  test.each([
    ['a granting role', ['reader'], 'file.download', true],
    ['no granting role', ['writer'], 'file.download', false],
    ['no roles', [], 'file.upload', false],
    ['the file-service-admin realm role', ['file-service-admin'], 'file.upload', true],
    ['the file-service-admin client role', ['urn:ads:platform:file-service:file-service-admin'], 'file.download', true],
  ] as const)('with %s returns %s', (_, roles, capability, expected) => {
    expect(resolveCapability(capability, [...roles], capabilities)).toBe(expected);
  });

  test('grants a capability the map leaves out only to File service admins', () => {
    expect(resolveCapability('file.upload', ['reader'], { 'file.download': ['reader'] })).toBe(false);
    expect(resolveCapability('file.download', ['file-service-admin'])).toBe(true);
  });
});

describe('useCapability', () => {
  test('allows everything without a provider', () => {
    const { result } = renderHook(() => useCapability('file.upload'));
    expect(result.current).toBe(true);
  });

  test('resolves through the provider', () => {
    const { result } = renderHook(() => [useCapability('file.download'), useCapability('file.upload')], {
      wrapper: wrapper(['reader'], capabilities),
    });
    expect(result.current).toEqual([true, false]);
  });

  test('lets an explicit override win over the provider', () => {
    const { result } = renderHook(() => [useCapability('file.upload', true), useCapability('file.download', false)], {
      wrapper: wrapper(['reader'], capabilities),
    });
    expect(result.current).toEqual([true, false]);
  });

  test('denies non-admins when the provider has no map', () => {
    const { result } = renderHook(() => useCapability('file.download'), { wrapper: wrapper(['reader']) });
    expect(result.current).toBe(false);
  });
});
