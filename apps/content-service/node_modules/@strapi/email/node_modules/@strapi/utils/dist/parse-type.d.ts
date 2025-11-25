type TypeMap = {
    boolean: boolean;
    integer: number;
    biginteger: number;
    float: number;
    decimal: number;
    time: string;
    date: string;
    timestamp: Date;
    datetime: Date;
};
export interface ParseTypeOptions<T extends keyof TypeMap> {
    type: T;
    value: unknown;
    forceCast?: boolean;
}
/**
 * Cast basic values based on attribute type
 */
declare const parseType: <Type extends keyof TypeMap>(options: ParseTypeOptions<Type>) => TypeMap[Type];
export default parseType;
//# sourceMappingURL=parse-type.d.ts.map