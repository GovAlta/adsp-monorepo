export type ID = string | number;
export type ShortHand = ID;
export type LongHandEntity = {
    id: ID;
    position?: object;
};
export type LongHandDocument = {
    documentId: ID;
    locale?: string;
    status?: 'draft' | 'published';
    position?: object;
};
export type LongHand = LongHandEntity | LongHandDocument;
export type RelationPrimitives = ShortHand | LongHand | ShortHand[] | LongHand[] | null | undefined;
export type Relation = RelationPrimitives | {
    connect?: RelationPrimitives;
    disconnect?: RelationPrimitives;
    set?: RelationPrimitives;
};
export type GetIds = (relation: ID) => ID[] | null;
//# sourceMappingURL=types.d.ts.map