import { z } from 'zod';
export declare const WidthSchema: z.ZodUnion<[z.ZodLiteral<4>, z.ZodLiteral<6>, z.ZodLiteral<8>, z.ZodLiteral<12>]>;
export declare const HomepageLayoutSchema: z.ZodObject<{
    version: z.ZodNumber;
    widgets: z.ZodArray<z.ZodObject<{
        uid: z.ZodString;
        width: z.ZodUnion<[z.ZodLiteral<4>, z.ZodLiteral<6>, z.ZodLiteral<8>, z.ZodLiteral<12>]>;
    }, "strict", z.ZodTypeAny, {
        uid: string;
        width: 8 | 6 | 4 | 12;
    }, {
        uid: string;
        width: 8 | 6 | 4 | 12;
    }>, "many">;
    updatedAt: z.ZodString;
}, "strict", z.ZodTypeAny, {
    updatedAt: string;
    version: number;
    widgets: {
        uid: string;
        width: 8 | 6 | 4 | 12;
    }[];
}, {
    updatedAt: string;
    version: number;
    widgets: {
        uid: string;
        width: 8 | 6 | 4 | 12;
    }[];
}>;
export type HomepageLayout = z.infer<typeof HomepageLayoutSchema>;
export declare const HomepageLayoutWriteSchema: z.ZodObject<{
    version: z.ZodOptional<z.ZodNumber>;
    widgets: z.ZodArray<z.ZodObject<{
        uid: z.ZodString;
        width: z.ZodUnion<[z.ZodLiteral<4>, z.ZodLiteral<6>, z.ZodLiteral<8>, z.ZodLiteral<12>]>;
    }, "strict", z.ZodTypeAny, {
        uid: string;
        width: 8 | 6 | 4 | 12;
    }, {
        uid: string;
        width: 8 | 6 | 4 | 12;
    }>, "many">;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    widgets: {
        uid: string;
        width: 8 | 6 | 4 | 12;
    }[];
    updatedAt?: string | undefined;
    version?: number | undefined;
}, {
    widgets: {
        uid: string;
        width: 8 | 6 | 4 | 12;
    }[];
    updatedAt?: string | undefined;
    version?: number | undefined;
}>;
export type HomepageLayoutWrite = z.infer<typeof HomepageLayoutWriteSchema>;
//# sourceMappingURL=schema.d.ts.map