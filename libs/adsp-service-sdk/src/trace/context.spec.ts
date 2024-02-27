import * as context from 'express-http-context';
import TraceParent = require('traceparent');
import { getContextTrace } from './context';

jest.mock('express-http-context');
const contextMock = context as jest.Mocked<typeof context>;

describe('getContextTrace', () => {
  it('can get context trace', () => {
    const trace = TraceParent.startOrResume(null, { transactionSampleRate: 0 });
    contextMock.get.mockReturnValueOnce(trace);

    const result = getContextTrace();
    expect(result).toBe(trace);
  });

  it('can return null for no context trace', () => {
    contextMock.get.mockReturnValueOnce(null);

    const result = getContextTrace();
    expect(result).toBeNull();
  });

  it('can get context trace', () => {
    const trace = 'not a traceparent';
    contextMock.get.mockReturnValueOnce(trace);

    const result = getContextTrace();
    expect(result).toBe(null);
  });
});
