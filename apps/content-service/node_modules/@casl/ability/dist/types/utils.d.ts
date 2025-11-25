import { AnyObject, Subject, SubjectType, ForcedSubject, AliasesMap } from './types';
export declare function wrapArray<T>(value: T[] | T): T[];
export declare function setByPath(object: AnyObject, path: string, value: unknown): void;
export declare function setSubjectType<T extends string, U extends Record<PropertyKey, any>>(type: T, object: U): U & ForcedSubject<T>;
export declare const isSubjectType: (value: unknown) => value is SubjectType;
export declare const getSubjectTypeName: (value: SubjectType) => string;
export declare function detectSubjectType(subject: Exclude<Subject, SubjectType>): string;
export declare type AliasResolverOptions = {
    skipValidate?: boolean;
    anyAction?: string;
};
export declare function createAliasResolver(aliasMap: AliasesMap, options?: AliasResolverOptions): (action: string | string[]) => string[];
export declare function mergePrioritized<T extends {
    priority: number;
}>(array?: T[], anotherArray?: T[]): T[];
export declare function getOrDefault<K, V>(map: Map<K, V>, key: K, defaultValue: () => V): V;
export declare const identity: <T>(x: T) => T;
