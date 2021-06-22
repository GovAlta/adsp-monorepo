// Allows the initial native javascript error to be handled in the same way as the GoAError
type Err = GoAError | (Error & { type: 'error'; id: ''; statusCode: -1 });

export class GoAError extends Error {
  public name: string;
  public statusCode?: number;
  public id?: string;
  public parent?: Err;
  type: 'GoAError';

  constructor(public message: string, props: Err) {
    super();
    Object.setPrototypeOf(this, GoAError.prototype);

    if (props.type === 'error') {
      this.parent = props;
      this.name = 'Error';
    } else {
      this.type = 'GoAError';
      this.id = props.id;
      this.parent = props.parent;
      this.name = props.name;
      this.statusCode = props.statusCode;
    }
  }
}

// Standard Errors

export class ServerError extends GoAError {
  constructor(message: string, err?: GoAError) {
    super(message, { ...err, name: 'ServerError', statusCode: 500, parent: err });
  }
}

export class RecordNotFoundError extends GoAError {
  constructor(message?: string, err?: GoAError) {
    super(message, { ...err, name: 'RecordNotFoundError ', statusCode: 404, parent: err });
  }
}

export class InvalidParamsError extends GoAError {
  constructor(message: string, err?: GoAError) {
    super(message, { ...err, name: 'InvalidParamsError', statusCode: 400, parent: err });
  }
}

export class MissingParamsError extends GoAError {
  constructor(message: string, err?: GoAError) {
    super(message, { ...err, name: 'MissingParamsError', statusCode: 400, parent: err });
  }
}

export class IOError extends GoAError {
  constructor(message: string, err?: GoAError) {
    super(message, { ...err, name: 'IOError', statusCode: 500, parent: err });
  }
}

export class InvalidCredentialsError extends GoAError {
  constructor(message: string, err?: GoAError) {
    super(message, { ...err, name: 'UnauthorizedError', statusCode: 401, parent: err });
  }
}

export class UnauthorizedError extends GoAError {
  constructor(message: string, err?: GoAError) {
    super(message, { ...err, name: 'UnauthorizedError', statusCode: 403, parent: err });
  }
}
