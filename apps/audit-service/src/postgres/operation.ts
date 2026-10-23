import { AuditStoreError } from '../audit/buffer';

export const STATEMENT_TIMEOUT_MS = 4_000;
export const HISTORY_QUERY_TIMEOUT_MS = 60_000;

const TRANSIENT_SQLSTATE_CLASSES = {
  connectionException: '08',
  transactionRollback: '40',
  insufficientResources: '53',
};

const CONSTRAINT_SQLSTATE_CLASSES = {
  dataException: '22',
  integrityConstraintViolation: '23',
};

const TRANSIENT_ERROR_CODES = {
  queryCanceled: '57014',
  adminShutdown: '57P01',
  crashShutdown: '57P02',
  cannotConnectNow: '57P03',
  lockNotAvailable: '55P03',
  connectionRefused: 'ECONNREFUSED',
  connectionReset: 'ECONNRESET',
  connectionTimedOut: 'ETIMEDOUT',
  brokenPipe: 'EPIPE',
};

export function databaseError(error: unknown): AuditStoreError {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : '';
  const errorClass = code.slice(0, 2);
  const transient =
    Object.values(TRANSIENT_SQLSTATE_CLASSES).includes(errorClass) ||
    Object.values(TRANSIENT_ERROR_CODES).includes(code) ||
    (error instanceof Error && error.name === 'KnexTimeoutError');
  const constraint = Object.values(CONSTRAINT_SQLSTATE_CLASSES).includes(errorClass);
  const kind = transient ? 'transient' : constraint ? 'constraint' : 'permanent';
  // PostgreSQL/Knex messages can include SQL bindings and actor data.
  return new AuditStoreError(`Audit database operation failed${code ? ` (${code})` : ''}.`, kind);
}
