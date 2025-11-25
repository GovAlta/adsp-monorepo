import type { Query } from '../../../../../../shared/contracts/files';
interface SearchAssetProps {
    onChangeSearch: (_q: Query['_q'] | null) => void;
    queryValue?: Query['_q'] | null;
}
export declare const SearchAsset: ({ onChangeSearch, queryValue }: SearchAssetProps) => import("react/jsx-runtime").JSX.Element;
export {};
