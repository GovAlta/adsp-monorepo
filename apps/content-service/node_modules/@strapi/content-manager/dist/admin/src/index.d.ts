import 'prismjs';
declare const _default: {
    register(app: any): void;
    bootstrap(app: any): void;
    registerTrads({ locales }: {
        locales: string[];
    }): Promise<({
        data: {
            [x: string]: string;
        };
        locale: string;
    } | {
        data: {};
        locale: string;
    })[]>;
};
export default _default;
export * from './exports';
