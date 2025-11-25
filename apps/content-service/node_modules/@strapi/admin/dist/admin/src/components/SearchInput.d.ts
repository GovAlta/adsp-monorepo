import { TrackingEvent } from '../features/Tracking';
interface SearchInputProps {
    disabled?: boolean;
    label: string;
    placeholder?: string;
    trackedEvent?: TrackingEvent['name'] | null;
    trackedEventDetails?: TrackingEvent['properties'];
}
declare const SearchInput: ({ disabled, label, placeholder, trackedEvent, trackedEventDetails, }: SearchInputProps) => import("react/jsx-runtime").JSX.Element;
export { SearchInput };
export type { SearchInputProps };
