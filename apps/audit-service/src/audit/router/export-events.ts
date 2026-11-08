import { isAllowedUser } from '@abgov/adsp-service-sdk';
import { RequestHandler } from 'express';
import { SelfAuditActions } from '../model';
import { AuditServiceRoles } from '../roles';
import { EventCursor, EventReader } from '../types';
import { createEventCsvFormat } from '../utils/event-csv';
import type { SelfAuditor } from '../utils/self-audit';
import { assertCanReadEvents, assertReader, getEndpoint, serializeEvent, toCriteria, toFilters } from './read-events';

// Events are read in keyset pages, so memory use is bounded by the page size rather than the result size.
const EXPORT_PAGE_SIZE = 1000;

export function exportEvents(reader?: EventReader, auditor?: SelfAuditor): RequestHandler {
  return async (req, res, next) => {
    let total = 0;
    let started = false;
    let criteria: ReturnType<typeof toCriteria>;
    try {
      const tenantId = assertCanReadEvents(req);
      const eventReader = assertReader(reader);
      criteria = toCriteria(req, tenantId);
      // Redaction is decided here, on the server, from the caller's own roles.
      const includePersonalInfo = isAllowedUser(req.user, req.tenant.id, AuditServiceRoles.Admin, true);
      const format = createEventCsvFormat(includePersonalInfo);

      let aborted = false;
      res.on('close', () => {
        aborted = !res.writableFinished;
      });

      let events = await eventReader.find(criteria, EXPORT_PAGE_SIZE);

      // The first page is read before the response starts, so a failure there still produces an error response.
      res.status(200);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-events-${new Date().toISOString().slice(0, 10)}.csv"`,
      );
      res.setHeader('Cache-Control', 'no-store');
      started = true;
      res.write(format.header);

      while (events.length > 0 && !aborted) {
        const chunk = format.rows(events.map((event) => serializeEvent(event, { redactActor: !includePersonalInfo })));
        total += events.length;
        if (!res.write(chunk)) {
          await new Promise<void>((resolve) => {
            res.once('drain', resolve);
            res.once('close', resolve);
          });
        }

        if (events.length < EXPORT_PAGE_SIZE) {
          break;
        }
        const last = events[events.length - 1];
        const cursor: EventCursor = { occurredAt: last.occurred_at, id: last.id };
        events = await eventReader.find(criteria, EXPORT_PAGE_SIZE, cursor);
      }

      res.end();
      await auditor?.record(req, {
        action: SelfAuditActions.ExportEvents,
        endpoint: getEndpoint(req),
        filters: toFilters(criteria),
        resultCount: total,
      });
    } catch (err) {
      if (started) {
        // Rows may already have been sent, so the failed export is recorded with the number written so far.
        await auditor?.record(req, {
          action: SelfAuditActions.ExportEvents,
          endpoint: getEndpoint(req),
          filters: toFilters(criteria),
          resultCount: total,
          status: 'failure',
        });
        // Headers are sent, so the only way to signal a truncated export is to break the connection.
        res.destroy(err as Error);
      } else {
        next(err);
      }
    }
  };
}
