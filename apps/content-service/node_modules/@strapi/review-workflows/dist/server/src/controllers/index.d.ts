/// <reference types="koa" />
declare const _default: {
    workflows: {
        create(ctx: import("koa").Context): Promise<void>;
        update(ctx: import("koa").Context): Promise<import("koa").Context | undefined>;
        delete(ctx: import("koa").Context): Promise<import("koa").Context | undefined>;
        find(ctx: import("koa").Context): Promise<void>;
    };
    stages: {
        find(ctx: import("koa").Context): Promise<void>;
        findById(ctx: import("koa").Context): Promise<void>;
        updateEntity(ctx: import("koa").Context): Promise<void>;
        listAvailableStages(ctx: import("koa").Context): Promise<import("koa").Context | undefined>;
    };
    assignees: {
        updateEntity(ctx: import("koa").Context): Promise<void>;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map