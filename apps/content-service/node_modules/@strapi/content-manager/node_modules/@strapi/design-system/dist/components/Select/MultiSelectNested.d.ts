import { MultiSelectGroupProps, MultiSelectOptionProps, MultiSelectProps } from './MultiSelect';
interface MulitSelectNestedOption extends Omit<MultiSelectOptionProps, 'children' | 'value'> {
    value: string | number;
    label: string;
}
interface MulitSelectNestedGroup extends Omit<MultiSelectGroupProps, 'children'> {
    children: Array<MulitSelectNestedOption>;
}
type MultiSelectNestedProps = MultiSelectProps & {
    options: Array<MulitSelectNestedOption | MulitSelectNestedGroup>;
};
declare const MultiSelectNested: ({ options, ...props }: MultiSelectNestedProps) => import("react/jsx-runtime").JSX.Element;
export { MultiSelectNested };
export type { MultiSelectNestedProps, MulitSelectNestedOption, MulitSelectNestedGroup };
//# sourceMappingURL=MultiSelectNested.d.ts.map