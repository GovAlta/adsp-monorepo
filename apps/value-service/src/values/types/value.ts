export interface Value {
  timestamp: Date
  correlationId: string
  context: {
    [key: string]: boolean | string | number
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}

export interface ValueCriteria {
  top?: number
  timestampMin?: Date
  timestampMax?: Date
}

export const VALUES_READ = 'READ';
export interface ValuesReadRequest {
  op: typeof VALUES_READ,
  values: {
    [value: string]: {
      criteria?: ValueCriteria
    }
  }
}

export const VALUES_WRITE = 'WRITE';
export interface ValuesWriteRequest {
  op: typeof VALUES_WRITE,
  values: {
    [value: string]: Value
  }
}
