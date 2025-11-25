import { ReactNode } from 'react';
interface SchemaContextType {
    lastRevisedId: string | null;
    setLastRevisedId: (id: string | null) => void;
}
export declare const SchemaChatProvider: ({ children }: {
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useChatSchema: () => SchemaContextType;
export {};
