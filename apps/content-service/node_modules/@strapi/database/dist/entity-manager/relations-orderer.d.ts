import type { ID } from '../types';
interface Link {
    id: ID;
    position?: {
        before?: ID;
        after?: ID;
        start?: true;
        end?: true;
    };
    order?: number;
    __component?: string;
}
interface OrderedLink extends Link {
    init?: boolean;
    order: number;
}
/**
 * When connecting relations, the order you connect them matters.
 *
 * Example, if you connect the following relations:
 *   { id: 5, position: { before: 1 } }
 *   { id: 1, position: { before: 2 } }
 *   { id: 2, position: { end: true } }
 *
 * Going through the connect array, id 5 has to be connected before id 1,
 * so the order of id5 = id1 - 1. But the order value of id 1 is unknown.
 * The only way to know the order of id 1 is to connect it first.
 *
 * This function makes sure the relations are connected in the right order:
 *   { id: 2, position: { end: true } }
 *   { id: 1, position: { before: 2 } }
 *   { id: 5, position: { before: 1 } }
 *
 */
declare const sortConnectArray: (connectArr: Link[], initialArr?: Link[], strictSort?: boolean) => Link[];
/**
 * Responsible for calculating the relations order when connecting them.
 *
 * The connect method takes an array of relations with positional attributes:
 * - before: the id of the relation to connect before
 * - after: the id of the relation to connect after
 * - end: it should be at the end
 * - start: it should be at the start
 *
 * Example:
 *  - Having a connect array like:
 *      [ { id: 4, before: 2 }, { id: 4, before: 3}, {id: 5, before: 4} ]
 * - With the initial relations:
 *      [ { id: 2, order: 4 }, { id: 3, order: 10 } ]
 * - Step by step, going through the connect array, the array of relations would be:
 *      [ { id: 4, order: 3.5 }, { id: 2, order: 4 }, { id: 3, order: 10 } ]
 *      [ { id: 2, order: 4 }, { id: 4, order: 3.5 }, { id: 3, order: 10 } ]
 *      [ { id: 2, order: 4 }, { id: 5, order: 3.5 },  { id: 4, order: 3.5 }, { id: 3, order: 10 } ]
 * - The final step would be to recalculate fractional order values.
 *      [ { id: 2, order: 4 }, { id: 5, order: 3.33 },  { id: 4, order: 3.66 }, { id: 3, order: 10 } ]
 *
 * @param {Array<*>} initArr - array of relations to initialize the class with
 * @param {string} idColumn - the column name of the id
 * @param {string} orderColumn - the column name of the order
 * @param {boolean} strict - if true, will throw an error if a relation is connected adjacent to
 *                               another one that does not exist
 * @return {*}
 */
declare const relationsOrderer: <TRelation extends Record<string, ID | null>>(initArr: TRelation[], idColumn: keyof TRelation, orderColumn: keyof TRelation, strict?: boolean) => {
    disconnect(relations: Link | Link[]): any;
    connect(relations: Link | Link[]): any;
    get(): OrderedLink[];
    /**
     * Get a map between the relation id and its order
     */
    getOrderMap(): Record<ID, number>;
};
export { relationsOrderer, sortConnectArray };
//# sourceMappingURL=relations-orderer.d.ts.map