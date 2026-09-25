import { SseParser } from './sse';

describe('SseParser', () => {
  it('can parse frames', () => {
    const parser = new SseParser();
    const frames = parser.push('id: 1\ndata: {"a":1}\n\nevent: adsp:ready\nid: 2\ndata: {}\n\n');
    expect(frames).toEqual([
      { id: '1', event: 'message', data: '{"a":1}' },
      { id: '2', event: 'adsp:ready', data: '{}' },
    ]);
  });

  it('can parse frames split across chunks', () => {
    const parser = new SseParser();
    expect(parser.push('id: 1\nda')).toEqual([]);
    expect(parser.push('ta: hello\n')).toEqual([]);
    expect(parser.push('\n')).toEqual([{ id: '1', event: 'message', data: 'hello' }]);
  });

  it('can ignore comments and handle CRLF and multi-line data', () => {
    const parser = new SseParser();
    const frames = parser.push(': keepalive\r\n\r\ndata: a\r\ndata: b\r\nretry: 10\r\nfield\r\n\r\n');
    expect(frames).toEqual([{ id: undefined, event: 'message', data: 'a\nb' }]);
  });

  it('can skip frames without data', () => {
    const parser = new SseParser();
    expect(parser.push('event: x\n\n')).toEqual([]);
  });
});
