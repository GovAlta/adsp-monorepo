/**
 * Hook to detect if a media query matches
 * @param query - Media query string (e.g., '(min-width: 768px)' or theme.breakpoints.large)
 * @returns boolean indicating if the media query matches
 */
export declare const useMediaQuery: (query: string) => boolean;
/**
 * Hook to detect if the current viewport is desktop size
 * Uses the theme's large breakpoint
 */
export declare const useIsDesktop: () => boolean;
/**
 * Hook to detect if the current viewport is tablet size
 * Uses the theme's medium breakpoint
 */
export declare const useIsTablet: () => boolean;
/**
 * Hook to detect if the current viewport is mobile size
 * Uses the theme's medium breakpoint (inverted)
 */
export declare const useIsMobile: () => boolean;
