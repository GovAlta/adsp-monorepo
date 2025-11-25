/// <reference types="node" />
import { Readable } from 'stream';
import type { Knex } from 'knex';
import type { QueryBuilder } from '../../query-builder';
import type { Database } from '../../..';
import { Meta } from '../../../metadata';
declare const knexPerformingQuery: unique symbol;
interface ReadableStrapiQueryOptions {
    qb: QueryBuilder;
    uid: string;
    db: Database;
    mapResults?: boolean;
    batchSize?: number;
}
declare class ReadableStrapiQuery extends Readable {
    _offset: number;
    _limit: number | null;
    _fetched: number;
    _query: Knex.QueryBuilder;
    _qb: QueryBuilder;
    _db: Database;
    _uid: string;
    _meta: Meta;
    _batchSize: number;
    _mapResults: boolean;
    [knexPerformingQuery]: boolean;
    constructor({ qb, db, uid, mapResults, batchSize }: ReadableStrapiQueryOptions);
    _destroy(err: Error, cb: (err?: Error) => void): void;
    /**
     * Custom ._read() implementation
     *
     *  NOTE: Here "size" means the number of entities to be read from the database.
     *  Not the actual byte size, as it would mean that we need to return partial entities.
     *
     */
    _read(size: number): Promise<void>;
}
export default ReadableStrapiQuery;
//# sourceMappingURL=readable.d.ts.map