import { GetProviders } from '../../../../../../shared/contracts/providers';
interface SSOProvidersProps {
    providers: GetProviders.Response;
    displayAllProviders?: boolean;
}
declare const SSOProviders: ({ providers, displayAllProviders }: SSOProvidersProps) => import("react/jsx-runtime").JSX.Element;
export { SSOProviders };
export type { SSOProvidersProps };
