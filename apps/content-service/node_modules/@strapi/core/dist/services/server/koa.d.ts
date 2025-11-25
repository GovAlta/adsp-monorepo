import Koa from 'koa';
declare module 'koa' {
    interface BaseResponse {
        send: (data: any, status?: number) => void;
        created: (data: any) => void;
        deleted: (data: any) => void;
        _explicitStatus: boolean;
        [key: string]: (message: string, details?: unknown) => void;
    }
}
declare const createKoaApp: ({ proxy, keys }: {
    proxy: boolean;
    keys: string[];
}) => Koa<Koa.DefaultState, Koa.DefaultContext>;
export default createKoaApp;
//# sourceMappingURL=koa.d.ts.map