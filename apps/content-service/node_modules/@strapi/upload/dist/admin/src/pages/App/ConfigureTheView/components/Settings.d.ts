import type { Configuration } from '../../../../../../shared/contracts/configuration';
interface SettingsProps {
    sort: string;
    pageSize: string | number;
    onChange: ({ target: { name, value }, }: {
        target: {
            name: keyof Configuration;
            value: string | number;
        };
    }) => void;
}
declare const Settings: ({ sort, pageSize, onChange }: SettingsProps) => import("react/jsx-runtime").JSX.Element;
export { Settings };
