// Replaced at build time (webpack DefinePlugin) with the content-hashed bundle paths from the vendor build
// manifest. The fallback is the unhashed path, used where the plugin does not run (e.g. jest).
declare const __TEMPLATE_VENDOR_BUNDLES__: Record<string, string> | undefined;

export const TEMPLATE_VENDOR_BUNDLES: Record<string, string> =
  typeof __TEMPLATE_VENDOR_BUNDLES__ !== 'undefined'
    ? __TEMPLATE_VENDOR_BUNDLES__
    : { react: 'assets/template-bundles/react/vendors.js' };
