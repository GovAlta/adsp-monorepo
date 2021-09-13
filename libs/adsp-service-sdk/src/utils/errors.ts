export type ErrorFormat = 'json' | 'text'

type Err = GoAError | (Error & { type: 'error'; id: ''; statusCode: -1 });

export interface GoAErrorExtra {
  name?: string,
  statusCode?: number,
  format?: ErrorFormat,
  type?: string
  parent?: Err
  id?: string
}

export class GoAError extends Error {
  public extra: GoAErrorExtra
  constructor(message?: string, extra?: GoAErrorExtra) {
    super(message);
    Object.setPrototypeOf(this, GoAError.prototype);
    this.extra = extra
  }
}
