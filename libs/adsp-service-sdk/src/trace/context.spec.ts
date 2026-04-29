import { trace as otelTrace, TraceFlags } from '@opentelemetry/api';
import { getContextTrace } from './context';

describe('getContextTrace', () => {
  it('can get context trace', () => {
    const getSpanSpy = jest.spyOn(otelTrace, 'getSpan').mockReturnValue({
      spanContext: () => ({
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
        traceFlags: TraceFlags.SAMPLED,
      }),
    } as never);

    const result = getContextTrace();
    expect(result?.toString()).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
    getSpanSpy.mockRestore();
  });

  it('can return null for no context trace', () => {
    const result = getContextTrace();
    expect(result).toBeNull();
  });
});
