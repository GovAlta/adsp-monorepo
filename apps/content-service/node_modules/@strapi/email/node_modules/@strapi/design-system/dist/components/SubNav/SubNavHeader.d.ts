import { TypographyProps } from '../../primitives/Typography';
import { SearchbarProps } from '../Searchbar';
export interface SubNavHeaderProps extends Pick<TypographyProps<'h2'>, 'tag'>, Partial<Pick<SearchbarProps, 'onClear' | 'onChange' | 'onSubmit' | 'placeholder'>> {
    id?: string;
    label: string;
    searchLabel?: string;
    searchable?: boolean;
    value?: string;
}
export declare const SubNavHeader: ({ tag, label, searchLabel, searchable, onChange, value, onClear, onSubmit, id, placeholder, }: SubNavHeaderProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SubNavHeader.d.ts.map