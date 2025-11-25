import { errors } from '@strapi/utils';
import { Entity, Pagination, SanitizedAdminUser } from './shared';
export interface SanitizedAdminUserForAuditLogs extends SanitizedAdminUser {
    displayName: string;
}
interface AuditLog extends Pick<Entity, 'id'> {
    date: string;
    action: string;
    /**
     * TODO: could this be better typed – working on the server-side code could indicate this.
     * However, we know it's JSON.
     */
    payload: Record<string, unknown>;
    user?: SanitizedAdminUserForAuditLogs;
}
declare namespace GetAll {
    interface Request {
        body: {};
        query: {};
    }
    type Response = {
        pagination: Pagination;
        results: AuditLog[];
        error?: never;
    } | {
        pagination?: never;
        results?: never;
        error?: errors.ApplicationError;
    };
}
declare namespace Get {
    interface Request {
        body: {};
        query: {};
    }
    interface Params {
        id: Entity['id'];
    }
    type Response = AuditLog | {
        error?: errors.ApplicationError;
    };
}
export { AuditLog, GetAll, Get };
