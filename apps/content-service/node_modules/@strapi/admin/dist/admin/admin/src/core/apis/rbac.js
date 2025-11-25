'use strict';

class RBAC {
    use(middleware) {
        if (Array.isArray(middleware)) {
            this.middlewares.push(...middleware);
        } else {
            this.middlewares.push(middleware);
        }
    }
    constructor(){
        this.middlewares = [];
        this.run = async (ctx, permissions)=>{
            let index = 0;
            const middlewaresToRun = this.middlewares.map((middleware)=>middleware(ctx));
            const next = async (permissions)=>{
                if (index < this.middlewares.length) {
                    return middlewaresToRun[index++](next)(permissions);
                }
                return permissions;
            };
            return next(permissions);
        };
    }
}

exports.RBAC = RBAC;
//# sourceMappingURL=rbac.js.map
