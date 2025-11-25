/// <reference types="react" />
declare const usePersistentState: <T>(key: string, defaultValue: T) => readonly [T, import("react").Dispatch<import("react").SetStateAction<T>>];
export { usePersistentState };
