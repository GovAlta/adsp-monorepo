import Field from './field';
export default class DatetimeField extends Field {
    toDB(value: unknown): Date;
    fromDB(value: unknown): string | null;
}
//# sourceMappingURL=datetime.d.ts.map