import * as yup from 'yup';
declare const handleYupError: (error: yup.ValidationError, errorMessage?: string) => never;
declare const validateYupSchema: <TSchema extends yup.AnySchema>(schema: TSchema, options?: {}) => (body: unknown, errorMessage?: string) => Promise<yup.InferType<TSchema>>;
declare const validateYupSchemaSync: <TSchema extends yup.AnySchema>(schema: yup.AnySchema, options?: {}) => (body: unknown, errorMessage?: string) => yup.InferType<TSchema>;
export { handleYupError, validateYupSchema, validateYupSchemaSync };
//# sourceMappingURL=validators.d.ts.map