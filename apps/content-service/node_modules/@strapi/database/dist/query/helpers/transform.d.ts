import type { Meta } from '../../metadata';
type Row = Record<string, unknown> | null;
export type Rec = Record<string, unknown> | null;
declare const fromRow: (meta: Meta, row: Row | Row[] | undefined) => Rec | Rec[];
declare function toRow<TData extends Rec | Rec[] | null>(meta: Meta, data: TData): TData extends null ? null : TData extends Rec[] ? Row[] : Rec;
declare const toColumnName: (meta: Meta, name: null | string) => string;
export { toRow, fromRow, toColumnName };
//# sourceMappingURL=transform.d.ts.map