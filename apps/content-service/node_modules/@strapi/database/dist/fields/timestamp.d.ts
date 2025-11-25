import Field from './field';
export default class TimestampField extends Field {
    toDB(value: unknown): Date;
    fromDB(value: unknown): string | null;
}
//# sourceMappingURL=timestamp.d.ts.map