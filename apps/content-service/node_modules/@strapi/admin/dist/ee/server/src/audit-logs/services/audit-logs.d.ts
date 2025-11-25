import type { Core } from '@strapi/types';
interface Event {
    action: string;
    date: Date;
    userId: string | number;
    payload: Record<string, unknown>;
}
/**
 * @description
 * Manages audit logs interaction with the database. Accessible via strapi.get('audit-logs')
 */
declare const createAuditLogsService: (strapi: Core.Strapi) => {
    saveEvent(event: Event): Promise<any>;
    findMany(query: unknown): Promise<{
        results: any[];
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    }>;
    findOne(id: unknown): Promise<any>;
    deleteExpiredEvents(expirationDate: Date): Promise<import("@strapi/database/dist/types").CountResult>;
};
export { createAuditLogsService };
//# sourceMappingURL=audit-logs.d.ts.map