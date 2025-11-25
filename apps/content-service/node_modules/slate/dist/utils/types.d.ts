import { Editor } from '../interfaces/editor';
export declare type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;
export declare type OmitFirstArgWithSpecificGeneric<F, TSpecific> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;
export declare type WithEditorFirstArg<T extends (...args: any) => any> = (editor: Editor, ...args: Parameters<T>) => ReturnType<T>;
//# sourceMappingURL=types.d.ts.map