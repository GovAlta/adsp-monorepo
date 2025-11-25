import { Schema } from '../../../hooks/useDocument';
interface FiltersProps {
    disabled?: boolean;
    schema: Schema;
}
declare const FiltersImpl: ({ disabled, schema }: FiltersProps) => import("react/jsx-runtime").JSX.Element;
export { FiltersImpl as Filters };
export type { FiltersProps };
