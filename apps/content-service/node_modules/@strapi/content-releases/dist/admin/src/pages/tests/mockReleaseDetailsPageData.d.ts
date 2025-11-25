declare const mockReleaseDetailsPageData: {
    readonly noActionsHeaderData: {
        data: {
            id: number;
            name: string;
            createdAt: string;
            updatedAt: string;
            releasedAt: null;
            status: string;
            createdBy: {
                id: number;
                firstname: string;
                lastname: string;
                username: null;
            };
            actions: {
                meta: {
                    count: number;
                };
            };
        };
    };
    readonly noActionsBodyData: {
        data: never[];
        meta: {
            pagination: {
                page: number;
                pageSize: number;
                total: number;
                pageCount: number;
            };
        };
    };
    readonly withActionsHeaderData: {
        data: {
            id: number;
            name: string;
            createdAt: string;
            updatedAt: string;
            releasedAt: null;
            status: string;
            createdBy: {
                id: number;
                firstname: string;
                lastname: string;
                username: null;
            };
            actions: {
                meta: {
                    count: number;
                };
            };
        };
    };
    readonly withActionsBodyData: {
        data: {
            Category: {
                id: number;
                type: string;
                createdAt: string;
                updatedAt: string;
                contentType: {
                    displayName: string;
                    mainFieldValue: string;
                    uid: string;
                };
                locale: {
                    name: string;
                    code: string;
                };
                entry: {
                    id: number;
                };
            }[];
        };
        meta: {
            pagination: {
                page: number;
                pageSize: number;
                total: number;
                pageCount: number;
            };
            contentTypes: {};
            components: {};
        };
    };
    readonly withMultipleActionsBodyData: {
        data: {
            Category: ({
                id: number;
                type: string;
                createdAt: string;
                updatedAt: string;
                contentType: {
                    displayName: string;
                    mainFieldValue: string;
                    uid: string;
                };
                locale: {
                    name: string;
                    code: string;
                };
                entry: {
                    id: number;
                    publishedAt: null;
                };
            } | {
                id: number;
                type: string;
                createdAt: string;
                updatedAt: string;
                contentType: {
                    displayName: string;
                    mainFieldValue: string;
                    uid: string;
                };
                locale: {
                    name: string;
                    code: string;
                };
                entry: {
                    id: number;
                    publishedAt: string;
                };
            })[];
            Address: {
                id: number;
                type: string;
                createdAt: string;
                updatedAt: string;
                contentType: {
                    displayName: string;
                    mainFieldValue: string;
                    uid: string;
                };
                locale: {
                    name: string;
                    code: string;
                };
                entry: {
                    id: number;
                    publishedAt: string;
                };
            }[];
        };
        meta: {
            pagination: {
                page: number;
                pageSize: number;
                total: number;
                pageCount: number;
            };
            contentTypes: {};
            components: {};
        };
    };
    readonly withActionsAndPublishedHeaderData: {
        data: {
            id: number;
            name: string;
            createdAt: string;
            updatedAt: string;
            releasedAt: string;
            status: string;
            createdBy: {
                id: number;
                firstname: string;
                lastname: string;
                username: null;
            };
            actions: {
                meta: {
                    count: number;
                };
            };
        };
    };
};
type MockReleaseDetailsPageData = typeof mockReleaseDetailsPageData;
export { mockReleaseDetailsPageData };
export type { MockReleaseDetailsPageData };
