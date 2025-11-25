export declare const tableHeaders: readonly [{
    readonly name: "action";
    readonly key: "action";
    readonly metadatas: {
        readonly label: {
            readonly id: "Settings.permissions.auditLogs.action";
            readonly defaultMessage: "Action";
        };
        readonly sortable: true;
    };
}, {
    readonly name: "date";
    readonly key: "date";
    readonly metadatas: {
        readonly label: {
            readonly id: "Settings.permissions.auditLogs.date";
            readonly defaultMessage: "Date";
        };
        readonly sortable: true;
    };
}, {
    readonly key: "user";
    readonly name: "user";
    readonly metadatas: {
        readonly label: {
            readonly id: "Settings.permissions.auditLogs.user";
            readonly defaultMessage: "User";
        };
        readonly sortable: false;
    };
    readonly cellFormatter: (user: any) => string;
}];
