/**
 * Sometimes, we want to retrieve the elements with tabindex=-1, and sometime we don't
 * The includeNegativeTabIndex aims to provide this capability
 *
 */
export declare const getFocusableNodes: (node: HTMLElement, includeNegativeTabIndex?: boolean) => HTMLElement[];
/**
 * This function filters an array of HTMLElements and returns any of them that have internal keyboard navigation such as input type="text"
 */
export declare const getFocusableNodesWithKeyboardNav: (nodes: HTMLElement[]) => HTMLElement[];
//# sourceMappingURL=getFocusableNodes.d.ts.map