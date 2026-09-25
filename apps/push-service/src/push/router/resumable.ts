import { UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import 'compression'; // Type extensions for res.flush().
import { Request, RequestHandler, Response } from 'express';
import { Logger } from 'winston';
import { BufferedEvent, BufferTailer, compareEntryIds, formatCursor, parseCursor, RedisEventBuffer } from '../../buffer';
import { StreamEntity } from '../model';
import { EventCriteria } from '../types';
import { mapStreamItem, STREAM_KEY } from './item';

export interface ResumableStreamOptions {
  keepAliveMs: number;
  replayPageSize: number;
}

export const READY_EVENT = 'adsp:ready';
export const RESET_EVENT = 'adsp:reset';
export const RECONNECT_EVENT = 'adsp:reconnect';

type ResetReason = 'invalid-cursor' | 'epoch-changed' | 'cursor-expired';

function parseCriteria(value: unknown): EventCriteria {
  try {
    return value ? JSON.parse(value as string) : {};
  } catch {
    throw new InvalidOperationError('Criteria must be valid JSON.');
  }
}

function getAuthorizedStream(req: Request): StreamEntity {
  const user = req.user as User;
  const entity: StreamEntity = req[STREAM_KEY];
  if (!entity.canSubscribe(user)) {
    throw new UnauthorizedUserError('access stream', user);
  }
  return entity;
}

function toData(epoch: string, { entryId, event }: BufferedEvent, entity: StreamEntity, criteria: EventCriteria) {
  const item = entity.processEvent(event, criteria);
  return item && { ...mapStreamItem(item), eventId: event.id || formatCursor(epoch, entryId) };
}

/**
 * Determines where a (re)connecting client should start reading from the buffer.
 */
async function resolveStart(
  buffer: RedisEventBuffer,
  entity: StreamEntity,
  epoch: string,
  cursorValue: unknown,
): Promise<{ position: string; replay: boolean; reset?: ResetReason }> {
  const cursor = parseCursor(cursorValue);
  let reset: ResetReason;
  if (cursorValue && !cursor) {
    reset = 'invalid-cursor';
  } else if (cursor && cursor.epoch !== epoch) {
    reset = 'epoch-changed';
  } else if (cursor && (await buffer.isTrimmedAfter(entity.tenantId, cursor.entryId))) {
    reset = 'cursor-expired';
  } else if (cursor) {
    return { position: cursor.entryId, replay: true };
  }

  return { position: await buffer.getHead(entity.tenantId), replay: false, reset };
}

function writeControl(res: Response, event: string, data: Record<string, unknown>, id?: string) {
  res.write(`event: ${event}\n${id ? `id: ${id}\n` : ''}data: ${JSON.stringify(data)}\n\n`);
  res.flush();
}

/**
 * SSE subscription that can resume from a cursor (`Last-Event-ID` header or `after` query parameter).
 *
 * Missed events are replayed from the buffer, then the connection joins the live tail. Data frames are unnamed
 * (`message`) so existing EventSource consumers keep working; control frames are named `adsp:*`.
 */
export function subscribeBySseResumable(
  logger: Logger,
  buffer: RedisEventBuffer,
  tailer: BufferTailer,
  { keepAliveMs, replayPageSize }: ResumableStreamOptions,
): RequestHandler {
  return async (req, res, next) => {
    let removeListener: () => void;
    try {
      const user = req.user as User;
      const entity = getAuthorizedStream(req);
      const criteria = parseCriteria(req.query.criteria);
      const tenantId = entity.tenantId;
      const epoch = await buffer.getEpoch(tenantId);

      let closed = false;
      let live = false;
      let position: string;
      const pending: BufferedEvent[] = [];

      const writeEntry = (entry: BufferedEvent): boolean => {
        position = entry.entryId;
        const data = toData(epoch, entry, entity, criteria);
        if (data) {
          res.write(`id: ${formatCursor(epoch, entry.entryId)}\ndata: ${JSON.stringify(data)}\n\n`);
          res.flush();
        }
        return !!data;
      };

      // Listen before reading the replay so nothing appended in between is missed; overlap is dropped by entry id.
      removeListener = await tailer.listen(tenantId, (entry) => {
        if (!live) {
          pending.push(entry);
        } else if (compareEntryIds(entry.entryId, position) > 0) {
          writeEntry(entry);
        }
      });

      const start = await resolveStart(buffer, entity, epoch, req.get('Last-Event-ID') || req.query.after);
      position = start.position;

      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.flushHeaders();

      const keepAlive = setInterval(() => {
        res.write(': keepalive\n\n');
        res.flush();
      }, keepAliveMs);

      // End the response when the token expires so the client reconnects (and resumes) with a fresh token.
      const exp = user?.token?.exp as number;
      const expiry = exp
        ? setTimeout(() => {
            writeControl(res, RECONNECT_EVENT, { reason: 'token-expired' });
            res.end();
          }, Math.min(Math.max(exp * 1000 - Date.now(), 0), 2 ** 31 - 1))
        : null;

      res.on('close', () => {
        closed = true;
        clearInterval(keepAlive);
        clearTimeout(expiry);
        removeListener();
        logger.info(`Client disconnected from stream '${entity.name}' on resumable server side event.`, {
          ...LOG_CONTEXT,
          tenant: tenantId.toString(),
          user: user ? `${user.name} (ID: ${user.id})` : null,
        });
      });

      if (start.reset) {
        writeControl(res, RESET_EVENT, { reason: start.reset });
      }

      let replayed = 0;
      if (start.replay) {
        let page: BufferedEvent[];
        do {
          page = await buffer.readAfter(tenantId, position, replayPageSize);
          replayed += page.filter((entry) => !closed && writeEntry(entry)).length;
        } while (page.length === replayPageSize && !closed);
      }

      for (const entry of pending.splice(0)) {
        if (compareEntryIds(entry.entryId, position) > 0) {
          writeEntry(entry);
        }
      }
      live = true;
      writeControl(res, READY_EVENT, { cursor: formatCursor(epoch, position), replayed }, formatCursor(epoch, position));

      logger.info(
        `Client connected on stream '${entity.name}' for user ${user?.name || 'anonymous'} (ID: ${
          user?.id || 'anonymous'
        }) on resumable server side event; replayed ${replayed} events${start.reset ? ` after reset (${start.reset})` : ''}.`,
        {
          ...LOG_CONTEXT,
          tenant: tenantId.toString(),
          user: user ? `${user.name} (ID: ${user.id})` : null,
        },
      );
    } catch (err) {
      removeListener?.();
      if (res.headersSent) {
        logger.warn(`Error encountered on resumable server side event: ${err}`, LOG_CONTEXT);
        res.end();
      } else {
        next(err);
      }
    }
  };
}

/**
 * Reads buffered stream events after a cursor; used for polling fallback and diagnostics.
 */
export function getStreamEvents(buffer: RedisEventBuffer, maxTop: number): RequestHandler {
  return async (req, res, next) => {
    try {
      const entity = getAuthorizedStream(req);
      if (!entity.tenantId) {
        throw new InvalidOperationError('Replay is not available for cross-tenant streams.');
      }
      const criteria = parseCriteria(req.query.criteria);
      const top = Math.min(parseInt(req.query.top as string) || maxTop, maxTop);
      const epoch = await buffer.getEpoch(entity.tenantId);
      const start = await resolveStart(buffer, entity, epoch, req.query.after);

      const entries = start.replay ? await buffer.readAfter(entity.tenantId, start.position, top) : [];
      const items = entries
        .map((entry) => ({ cursor: formatCursor(epoch, entry.entryId), data: toData(epoch, entry, entity, criteria) }))
        .filter(({ data }) => data)
        .map(({ cursor, data }) => ({ cursor, ...data }));

      res.send({
        reset: start.reset || null,
        items,
        next: formatCursor(epoch, entries[entries.length - 1]?.entryId || start.position),
      });
    } catch (err) {
      next(err);
    }
  };
}

const LOG_CONTEXT = { context: 'ResumableStream' };
