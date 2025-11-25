type User = any;
export declare const conditions: ({
    displayName: string;
    name: string;
    plugin: string;
    handler: (user: User) => {
        'createdBy.id': any;
    };
} | {
    displayName: string;
    name: string;
    plugin: string;
    handler: (user: User) => {
        'createdBy.roles': {
            $elemMatch: {
                id: {
                    $in: any;
                };
            };
        };
    };
})[];
declare const _default: {
    conditions: ({
        displayName: string;
        name: string;
        plugin: string;
        handler: (user: any) => {
            'createdBy.id': any;
        };
    } | {
        displayName: string;
        name: string;
        plugin: string;
        handler: (user: any) => {
            'createdBy.roles': {
                $elemMatch: {
                    id: {
                        $in: any;
                    };
                };
            };
        };
    })[];
};
export default _default;
//# sourceMappingURL=admin-conditions.d.ts.map