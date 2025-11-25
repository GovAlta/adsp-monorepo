import type { IDestinationProvider, ISourceProvider, ProviderType } from '../../../types';
declare const validateProvider: <T extends ProviderType>(type: ProviderType, provider?: ([T] extends ['source'] ? ISourceProvider : IDestinationProvider) | null) => undefined;
export { validateProvider };
//# sourceMappingURL=provider.d.ts.map