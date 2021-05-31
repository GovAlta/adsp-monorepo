import {
  GoAError,
  InvalidCredentialsError,
  InvalidParamsError,
  IOError,
  MissingParamsError,
  RecordNotFoundError,
  ServerError,
  UnauthorizedError,
} from './errors';

export class TestError extends GoAError {
  constructor(message: string, err?: GoAError) {
    super(message, { ...err, name: 'TestError', id: 'goa-567', statusCode: 400, parent: err });
  }
}

export class TestParentWithStatusError extends GoAError {
  constructor(message: string, err?: GoAError) {
    super(message, { ...err, name: 'TestParentWithStatusError ', statusCode: 500, id: 'goa-001', parent: err });
  }
}

describe('errors', () => {
  // tests for all pre-defined error types
  const errors = [
    new ServerError('server err'),
    new RecordNotFoundError('record not found err'),
    new InvalidParamsError('invalid params err'),
    new MissingParamsError('missing params err'),
    new IOError('io err'),
    new InvalidCredentialsError('invalid credentials err'),
    new UnauthorizedError('unauthorized err'),
  ];

  for (const err of errors) {
    it(`should handle the ${err.name} error`, async () => {
      try {
        throw err;
      } catch (e) {
        const ge = e as GoAError;
        expect(ge.id).toEqual(err.id);
        expect(ge.message).toEqual(err.message);
        expect(ge.name).toEqual(err.name);
        expect(ge.parent).toBeUndefined();
        expect(ge.statusCode).toEqual(err.statusCode);
      }
    });
  }

  it('should show a parent/child error', async () => {
    try {
      try {
        throw new IOError('IO Error');
      } catch (e) {
        throw new ServerError('Failed first to parse some data', e);
      }
    } catch (e) {
      const ge = e as GoAError;
      expect(ge.message).toEqual('Failed first to parse some data');
      expect(ge.statusCode).toEqual(500);
      expect(ge.parent.message).toEqual('IO Error');
    }
  });

  it('child status code overrides parent', async () => {
    const err = new IOError('IO Error');
    try {
      try {
        throw err;
      } catch (e) {
        throw new TestError('Failed first to parse some data', e);
      }
    } catch (e) {
      const ge = e as GoAError;
      expect(ge.message).toEqual('Failed first to parse some data');
      expect(ge.name).toEqual('TestError');
      expect(ge.statusCode).not.toEqual(err.statusCode);
      expect(ge.statusCode).toEqual(400); // 400 -> TestError's status code
    }
  });

  it('wraps native javascript error', async () => {
    try {
      try {
        throw Error('some native js error');
      } catch (e) {
        throw new TestError('Failed first to parse some data', e);
      }
    } catch (e) {
      const ge = e as GoAError;
      expect(ge.id).toEqual('goa-567');
      expect(ge.message).toEqual('Failed first to parse some data');
      expect(ge.name).toEqual('TestError');
      expect(ge.statusCode).toEqual(400);
    }
  });
});
