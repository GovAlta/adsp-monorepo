import { ClientRotationState, decideRotation } from './decision';

const DAY = 24 * 60 * 60 * 1000;
const config = { noticeWindowDays: 60, rotatedSecretOverlapDays: 7, minNoticeGapDays: 7 };
const now = new Date('2026-06-01T00:00:00Z');
const inDays = (days: number) => new Date(now.getTime() + days * DAY);

describe('decideRotation', () => {
  const decide = (state: ClientRotationState) => decideRotation(state, config, now);

  describe('client with no expiry', () => {
    it('sends an onboarding notice dated one window ahead', () => {
      expect(decide({})).toEqual([{ type: 'notice', dueAt: inDays(60), onboarding: true }]);
    });

    it('waits until the notified date', () => {
      expect(decide({ noticeSentFor: inDays(10), noticeSentAt: inDays(-50) })).toEqual([]);
    });

    it('rotates once the notified date has arrived', () => {
      expect(decide({ noticeSentFor: inDays(-1), noticeSentAt: inDays(-61) })).toEqual([
        { type: 'rotate', emergency: false },
      ]);
    });
  });

  describe('client with an expiry', () => {
    it('does nothing outside the notice window', () => {
      expect(decide({ expiry: inDays(61) })).toEqual([]);
    });

    it('sends a notice inside the window when none was sent for this expiry', () => {
      expect(decide({ expiry: inDays(59), noticeSentFor: inDays(-30) })).toEqual([
        { type: 'notice', dueAt: inDays(59), onboarding: false },
      ]);
    });

    it('does not repeat a notice already sent for this expiry', () => {
      expect(decide({ expiry: inDays(30), noticeSentFor: inDays(30), noticeSentAt: inDays(-5) })).toEqual([]);
    });

    it('rotates at the end of the window once the notice is old enough', () => {
      expect(decide({ expiry: inDays(6), noticeSentFor: inDays(6), noticeSentAt: inDays(-50) })).toEqual([
        { type: 'rotate', emergency: false },
      ]);
    });

    it('does not rotate when the notice is more recent than the minimum gap', () => {
      expect(decide({ expiry: inDays(6), noticeSentFor: inDays(6), noticeSentAt: inDays(-2) })).toEqual([]);
    });

    it('notifies rather than rotates when no notice was sent for a due rotation', () => {
      expect(decide({ expiry: inDays(3) })).toEqual([{ type: 'notice', dueAt: inDays(3), onboarding: false }]);
    });

    it('rotates an expired secret as an emergency', () => {
      expect(decide({ expiry: inDays(-1) })).toEqual([{ type: 'rotate', emergency: true }]);
    });
  });

  describe('revocation notice', () => {
    it('is sent when the overlap has ended', () => {
      expect(decide({ expiry: inDays(80), lastRotated: inDays(-8) })).toEqual([
        { type: 'revoked-notice', rotatedAt: inDays(-8), revokedAt: inDays(-1) },
      ]);
    });

    it('prefers the rotated secret expiry when present', () => {
      expect(decide({ expiry: inDays(80), lastRotated: inDays(-8), rotatedExpiry: inDays(2) })).toEqual([]);
    });

    it('is not repeated once sent for that rotation', () => {
      expect(decide({ expiry: inDays(80), lastRotated: inDays(-8), revokedNoticeSentFor: inDays(-8) })).toEqual([]);
    });

    it('can accompany a rotation decision', () => {
      expect(decide({ expiry: inDays(-1), lastRotated: inDays(-100) })).toEqual([
        { type: 'revoked-notice', rotatedAt: inDays(-100), revokedAt: inDays(-93) },
        { type: 'rotate', emergency: true },
      ]);
    });
  });
});
