/**
 * Returns actions available for a role.
 * @param {string|number} roleId
 * @returns {object[]}
 */
declare const getAllowedActionsForRole: (roleId?: string) => Promise<import("../domain/action").Action[]>;
export { getAllowedActionsForRole };
//# sourceMappingURL=action.d.ts.map