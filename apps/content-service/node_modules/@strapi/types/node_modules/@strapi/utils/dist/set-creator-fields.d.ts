export interface Options {
    user: User;
    isEdition?: boolean;
}
interface User {
    id: string | number;
}
declare const setCreatorFields: <TData extends object>({ user, isEdition }: Options) => <TDataInner extends object = TData>(data: TDataInner) => TDataInner;
export default setCreatorFields;
//# sourceMappingURL=set-creator-fields.d.ts.map