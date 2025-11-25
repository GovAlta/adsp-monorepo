interface LastSeenSchema {
    uid: string;
    type: 'contentType' | 'component';
    timestamp: number;
}
export declare const useLastSeenSchemas: () => {
    lastSeenSchemas: LastSeenSchema[];
    clearHistory: () => void;
};
export {};
