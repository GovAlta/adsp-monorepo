interface Option {
    value: string | number | null;
    depth: number;
}
export declare function getValuesToClose(options: Option[], value: number | string | null): (string | number | null)[];
export {};
