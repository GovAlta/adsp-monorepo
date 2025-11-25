import { type Filters } from '@strapi/admin/strapi-admin';
import { ComboboxProps } from '@strapi/design-system';
interface AssigneeFilterProps extends Pick<ComboboxProps, 'value' | 'onChange'> {
}
declare const AssigneeFilter: ({ name }: Filters.ValueInputProps) => import("react/jsx-runtime").JSX.Element;
export { AssigneeFilter };
export type { AssigneeFilterProps };
