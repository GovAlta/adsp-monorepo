import type { UID, Modules } from '@strapi/types';
export type RepositoryFactoryMethod = <TContentTypeUID extends UID.ContentType>(uid: TContentTypeUID, entityValidator: Modules.EntityValidator.EntityValidator) => Modules.Documents.ServiceInstance<TContentTypeUID>;
export declare const wrapInTransaction: (fn: (...args: any) => any) => (...args: any[]) => Promise<any>;
//# sourceMappingURL=common.d.ts.map