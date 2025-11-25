import type { File } from '../../../../shared/contracts/files';
type FileSelectable = File & {
    isSelectable?: boolean;
};
export type AllowedTypes = 'files' | 'images' | 'videos' | 'audios';
interface AssetCardProps {
    asset: FileSelectable;
    local?: boolean;
    onSelect?: (asset: FileSelectable) => void;
    onEdit?: (asset: FileSelectable) => void;
    onRemove?: (asset: FileSelectable) => void;
    isSelected?: boolean;
    size?: 'S' | 'M';
    allowedTypes?: AllowedTypes[];
    alt?: string;
    className?: string;
}
export declare const AssetCard: ({ asset, isSelected, onSelect, onEdit, onRemove, size, local, className, }: AssetCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
