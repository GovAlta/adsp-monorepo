import type { UID, Utils, Modules, Core } from '@strapi/types';
declare const EVENTS: {
    ENTRY_CREATE: string;
    ENTRY_UPDATE: string;
    ENTRY_DELETE: string;
    ENTRY_PUBLISH: string;
    ENTRY_UNPUBLISH: string;
    ENTRY_DRAFT_DISCARD: string;
};
type EventName = Utils.Object.Values<typeof EVENTS>;
/**
 * Manager to trigger entry related events
 *
 * It will populate the entry if it is not a delete event.
 * So the event payload will contain the full entry.
 */
declare const createEventManager: (strapi: Core.Strapi, uid: UID.Schema) => {
    /**
     * strapi.db.query might reuse the transaction used in the doc service request,
     * so this is executed after that transaction is committed.
     */
    emitEvent(eventName: EventName, entry: Modules.Documents.AnyDocument): void;
};
export { createEventManager };
//# sourceMappingURL=events.d.ts.map