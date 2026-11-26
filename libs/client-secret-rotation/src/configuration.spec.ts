import {
  assertValidOverrides,
  DEFAULT_CONFIGURATION,
  resolveConfiguration,
  resolveRealmSettings,
} from './configuration';

describe('assertValidOverrides', () => {
  it('accepts whole numbers above zero and unset values', () => {
    expect(() => assertValidOverrides({ expiryDays: 30, noticeWindowDays: undefined })).not.toThrow();
  });

  it.each([0, -1, 1.5, NaN, '5' as never])('rejects %p', (value) => {
    expect(() => assertValidOverrides({ expiryDays: value })).toThrow('expiryDays');
  });
});

describe('resolveRealmSettings', () => {
  it('uses the global schedule without overrides', () => {
    expect(resolveRealmSettings(DEFAULT_CONFIGURATION, undefined)).toEqual({
      expiryDays: 90,
      noticeWindowDays: 60,
      rotatedSecretOverlapDays: 7,
      minNoticeGapDays: 7,
    });
  });

  it('applies overrides and ignores values that are not positive numbers', () => {
    const settings = resolveRealmSettings(DEFAULT_CONFIGURATION, {
      expiryDays: 120,
      noticeWindowDays: 0,
      rotatedSecretOverlapDays: '3' as never,
    });

    expect(settings).toMatchObject({ expiryDays: 120, noticeWindowDays: 60, rotatedSecretOverlapDays: 7 });
  });

  it('rejects a notice window that is not shorter than the lifetime', () => {
    expect(() => resolveRealmSettings(DEFAULT_CONFIGURATION, { expiryDays: 60 })).toThrow('noticeWindowDays');
  });

  it('rejects a grace period that is not shorter than the lifetime', () => {
    expect(() => resolveRealmSettings(DEFAULT_CONFIGURATION, { rotatedSecretOverlapDays: 90 })).toThrow(
      'rotatedSecretOverlapDays',
    );
  });

  it('rejects a notice window shorter than the minimum notice gap', () => {
    expect(() => resolveRealmSettings(DEFAULT_CONFIGURATION, { noticeWindowDays: 5 })).toThrow('minNoticeGapDays');
  });
});

describe('resolveConfiguration', () => {
  it('rejects an invalid global schedule', () => {
    expect(() => resolveConfiguration({ expiryDays: 30 })).toThrow('noticeWindowDays');
  });
});
