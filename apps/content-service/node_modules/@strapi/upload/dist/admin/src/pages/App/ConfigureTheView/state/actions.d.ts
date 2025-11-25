import type { InitialState } from './init';
export declare const onChange: ({ name, value, }: {
    name: keyof NonNullable<InitialState['initialData']>;
    value: number | string;
}) => {
    type: string;
    keys: keyof import("../../../../../../shared/contracts/configuration").Configuration;
    value: string | number;
};
export declare const setLoaded: () => {
    type: string;
};
