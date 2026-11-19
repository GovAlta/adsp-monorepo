import { buildNext, SuggestedCall, withRelatedAndNext } from './envelope';

const call = (tool: string, args: Record<string, unknown> = {}): SuggestedCall => ({
  tool,
  arguments: args,
  why: 'because',
});

describe('envelope', () => {
  describe('buildNext', () => {
    it('caps suggestions at 3', () => {
      const next = buildNext([call('a'), call('b'), call('c'), call('d'), call('e')]);

      expect(next?.suggested_calls.map((c) => c.tool)).toEqual(['a', 'b', 'c']);
    });

    it('drops the call just made', () => {
      const next = buildNext([call('a', { x: 1 }), call('a', { x: 2 }), undefined], {
        tool: 'a',
        arguments: { x: 1 },
      });

      expect(next?.suggested_calls).toEqual([call('a', { x: 2 })]);
    });

    it('drops duplicate calls', () => {
      const next = buildNext([call('a', { x: 1 }), call('a', { x: 1 }), call('b')]);

      expect(next?.suggested_calls.map((c) => c.tool)).toEqual(['a', 'b']);
    });

    it('never suggests a live tool', () => {
      const next = buildNext([call('list_service_roles'), call('get_service_configuration_schema'), call('a')]);

      expect(next?.suggested_calls.map((c) => c.tool)).toEqual(['a']);
    });

    it('returns undefined when nothing is left', () => {
      expect(buildNext([undefined, call('list_service_roles')])).toBeUndefined();
    });
  });

  describe('withRelatedAndNext', () => {
    it('leaves out empty related and missing next', () => {
      expect(withRelatedAndNext({ a: 1 }, {}, undefined)).toEqual({ a: 1 });
      expect(withRelatedAndNext({ a: 1 }, undefined, undefined)).not.toHaveProperty('related');
    });

    it('adds related and next when present', () => {
      const next = { suggested_calls: [call('a')] };

      expect(withRelatedAndNext({ a: 1 }, { docs: ['d'] }, next)).toEqual({ a: 1, related: { docs: ['d'] }, next });
    });
  });
});
