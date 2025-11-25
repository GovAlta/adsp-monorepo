/**
 * A valid transfer token salt must be a non-empty string defined in the Strapi config
 */
declare const hasValidTokenSalt: () => boolean;
/**
 * Checks whether data transfer features are enabled
 */
declare const isRemoteTransferEnabled: () => boolean;
export { isRemoteTransferEnabled, hasValidTokenSalt };
//# sourceMappingURL=utils.d.ts.map