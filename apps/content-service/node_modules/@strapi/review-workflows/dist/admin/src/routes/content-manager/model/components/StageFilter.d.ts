import { type Filters } from '@strapi/admin/strapi-admin';
import { SingleSelectProps } from '@strapi/design-system';
interface StageFilterProps extends Pick<SingleSelectProps, 'value' | 'onChange'> {
    uid?: string;
}
declare const StageFilter: (props: Filters.ValueInputProps) => import("react/jsx-runtime").JSX.Element;
export { StageFilter };
export type { StageFilterProps };
