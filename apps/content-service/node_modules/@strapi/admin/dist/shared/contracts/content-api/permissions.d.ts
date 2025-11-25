export interface ContentApiPermission {
    apiId?: string;
    label?: string;
    controllers?: {
        controller: string;
        actions: {
            actionId: string;
            action: string;
        }[];
    }[];
}
/**
 * GET /content-api/permissions - List content API permissions
 */
export declare namespace List {
    interface Request {
        body: {};
        query: {};
    }
    interface Response {
        data: ContentApiPermission;
    }
}
