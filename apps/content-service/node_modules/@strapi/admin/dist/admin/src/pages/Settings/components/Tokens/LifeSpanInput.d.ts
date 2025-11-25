import { MessageDescriptor } from 'react-intl';
import type { ApiToken } from '../../../../../../shared/contracts/api-token';
import type { TransferToken } from '../../../../../../shared/contracts/transfer';
interface LifeSpanInputProps {
    error?: string | MessageDescriptor;
    value?: string | number | null;
    onChange: (event: {
        target: {
            name: string;
            value: string;
        };
    }) => void;
    isCreating: boolean;
    token: Partial<TransferToken> | Partial<ApiToken> | null;
}
export declare const LifeSpanInput: ({ token, error, value, onChange, isCreating, }: LifeSpanInputProps) => import("react/jsx-runtime").JSX.Element;
export {};
