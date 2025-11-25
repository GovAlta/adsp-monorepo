declare const mockReleasesPageData: {
    readonly emptyEntries: {
        data: never[];
        meta: {
            pagination: {
                page: number;
                pageSize: number;
                pageCount: number;
                total: number;
            };
        };
    };
    readonly pendingEntries: {
        data: {
            id: number;
            name: string;
            releasedAt: null;
            createdAt: string;
            updatedAt: string;
            actions: {
                meta: {
                    count: number;
                };
            };
        }[];
        meta: {
            pagination: {
                page: number;
                pageSize: number;
                pageCount: number;
                total: number;
            };
            pendingReleasesCount: number;
        };
    };
};
type MockReleasesPageData = typeof mockReleasesPageData;
export { mockReleasesPageData };
export type { MockReleasesPageData };
