/// <reference types="koa" />
/// <reference types="koa__router" />
import Router from '@koa/router';
import { yup } from '@strapi/utils';
import type { Core } from '@strapi/types';
declare const validateRouteConfig: (routeConfig: Core.RouteInput) => import("yup/lib/object").AssertsShape<{
    method: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    path: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    handler: import("yup/lib/Lazy").default<import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>> | import("yup/lib/mixed").MixedSchema<any, Record<string, any>, any> | import("yup/lib/array").RequiredArraySchema<yup.AnySchema, import("yup/lib/types").AnyObject, any[] | undefined>, any>;
    request: import("yup/lib/object").OptionalObjectSchema<{
        params: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
        query: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
        body: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        params: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
        query: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
        body: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    }>>;
    response: import("yup/lib/object").OptionalObjectSchema<import("yup/lib/object").ObjectShape, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").ObjectShape>>;
    config: import("yup/lib/object").OptionalObjectSchema<{
        auth: import("yup/lib/Lazy").default<import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>> | import("yup/lib/object").OptionalObjectSchema<{
            scope: import("yup/lib/array").RequiredArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined>;
        }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
            scope: import("yup/lib/array").RequiredArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined>;
        }>>, any>;
        policies: any;
        middlewares: any;
    }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
        auth: import("yup/lib/Lazy").default<import("yup/lib/boolean").RequiredBooleanSchema<boolean | undefined, Record<string, any>> | import("yup/lib/object").OptionalObjectSchema<{
            scope: import("yup/lib/array").RequiredArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined>;
        }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
            scope: import("yup/lib/array").RequiredArraySchema<import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>, import("yup/lib/types").AnyObject, (string | undefined)[] | undefined>;
        }>>, any>;
        policies: any;
        middlewares: any;
    }>>;
}> | undefined;
declare const createRouteManager: (strapi: Core.Strapi, opts?: {
    type?: string;
}) => {
    addRoutes: (routes: Core.Router | Core.RouteInput[], router: Router) => Router<import("koa").DefaultState, import("koa").DefaultContext> | undefined;
};
export { validateRouteConfig, createRouteManager };
//# sourceMappingURL=routing.d.ts.map