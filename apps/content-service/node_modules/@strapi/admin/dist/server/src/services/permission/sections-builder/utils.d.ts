/// <reference types="lodash" />
import type { Internal, Struct } from '@strapi/types';
declare const isOfKind: (kind: unknown) => (value: any) => boolean;
declare const resolveContentType: (uid: Internal.UID.ContentType) => Struct.ContentTypeSchema;
declare const isNotInSubjects: (subjects: any) => (uid: unknown) => boolean;
declare const hasProperty: import("lodash").CurriedFunction2<unknown, any, boolean>;
declare const getValidOptions: import("lodash/fp").LodashPick2x1;
declare const toSubjectTemplate: (ct: any) => {
    uid: any;
    label: any;
    properties: never[];
};
export { isOfKind, resolveContentType, isNotInSubjects, hasProperty, getValidOptions, toSubjectTemplate, };
//# sourceMappingURL=utils.d.ts.map