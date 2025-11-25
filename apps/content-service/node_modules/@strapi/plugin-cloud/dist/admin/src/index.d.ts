declare const _default: {
    register(app: any): void;
    registerTrads(app: any): Promise<({
        data: {
            [x: string]: string;
        };
        locale: any;
    } | {
        data: {};
        locale: any;
    })[]>;
};
export default _default;
