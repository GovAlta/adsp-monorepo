export type IdentityProviderResponse = Array<IdentityProvider>;

interface IdentityProvider {
  identityProvider: string;
  userId: string;
  userName: string;
}
