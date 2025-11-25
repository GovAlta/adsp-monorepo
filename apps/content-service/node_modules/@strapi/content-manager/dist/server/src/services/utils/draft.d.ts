/**
 * sumDraftCounts works recursively on the attributes of a model counting the
 * number of draft relations
 * These relations can be direct to this content type or contained within components/dynamic zones
 * @param {Object} entity containing the draft relation counts
 * @param {String} uid of the content type
 * @returns {Number} of draft relations
 */
declare const sumDraftCounts: (entity: any, uid: any) => number;
export { sumDraftCounts };
//# sourceMappingURL=draft.d.ts.map