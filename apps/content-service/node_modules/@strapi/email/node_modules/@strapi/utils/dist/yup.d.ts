import * as yup from 'yup';
export * from 'yup';
export declare const strapiID: () => InstanceType<typeof StrapiIDSchema>;
export declare class StrapiIDSchema extends yup.MixedSchema {
    constructor();
    _typeCheck(value: unknown): value is string | number;
}
declare module 'yup' {
    interface BaseSchema {
        isFunction(message?: string): this;
        notNil(message?: string): this;
        notNull(message?: string): this;
    }
    interface StringSchema {
        isCamelCase(message?: string): this;
        isKebabCase(message?: string): this;
    }
    interface ObjectSchema<TShape> {
        onlyContainsFunctions(message?: string): this;
    }
}
//# sourceMappingURL=yup.d.ts.map