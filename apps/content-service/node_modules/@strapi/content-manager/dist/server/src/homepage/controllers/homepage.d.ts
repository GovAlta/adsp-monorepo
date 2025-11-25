/// <reference types="node" />
import type { GetRecentDocuments, GetCountDocuments } from '../../../../shared/contracts/homepage';
declare const createHomepageController: () => {
    getRecentDocuments(ctx: import("koa").Context): Promise<GetRecentDocuments.Response>;
    getCountDocuments(): Promise<GetCountDocuments.Response>;
};
export { createHomepageController };
//# sourceMappingURL=homepage.d.ts.map