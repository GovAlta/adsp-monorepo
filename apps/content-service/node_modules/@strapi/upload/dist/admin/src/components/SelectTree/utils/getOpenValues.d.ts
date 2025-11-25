interface Option {
    value: number | string | null;
    parent?: number | string | null;
}
interface DefaultValue {
    value?: number | string | null;
}
export declare function getOpenValues(options: Option[], defaultValue?: DefaultValue): (string | number | null)[];
export {};
