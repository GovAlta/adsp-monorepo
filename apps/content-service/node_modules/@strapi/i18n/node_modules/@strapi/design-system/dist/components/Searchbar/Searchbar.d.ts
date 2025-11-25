import * as React from 'react';
import { Field } from '../Field';
export interface SearchbarProps extends Field.InputProps {
    children: React.ReactNode;
    name: string;
    value?: string;
    onClear: React.MouseEventHandler<any>;
    clearLabel: string;
}
export declare const Searchbar: React.ForwardRefExoticComponent<SearchbarProps & React.RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=Searchbar.d.ts.map