'use strict';

var _ = require('lodash/fp');
var database = require('../errors/database.js');
var transactionContext = require('../transaction-context.js');
var knex = require('../utils/knex.js');
var search = require('./helpers/search.js');
var orderBy = require('./helpers/order-by.js');
var join = require('./helpers/join.js');
var apply = require('./helpers/populate/apply.js');
var process = require('./helpers/populate/process.js');
var where = require('./helpers/where.js');
var transform = require('./helpers/transform.js');
var readable = require('./helpers/streams/readable.js');

const createQueryBuilder = (uid, db, initialState = {})=>{
    const meta = db.metadata.get(uid);
    const { tableName } = meta;
    const state = _.defaults({
        type: 'select',
        select: [],
        count: null,
        max: null,
        first: false,
        data: null,
        where: [],
        joins: [],
        populate: null,
        limit: null,
        offset: null,
        transaction: null,
        forUpdate: false,
        onConflict: null,
        merge: null,
        ignore: false,
        orderBy: [],
        groupBy: [],
        increments: [],
        decrements: [],
        aliasCounter: 0,
        filters: null,
        search: null,
        processed: false
    }, initialState);
    const getAlias = ()=>{
        const alias = `t${state.aliasCounter}`;
        state.aliasCounter += 1;
        return alias;
    };
    return {
        alias: getAlias(),
        getAlias,
        state,
        clone () {
            return createQueryBuilder(uid, db, state);
        },
        select (args) {
            state.type = 'select';
            state.select = _.uniq(_.castArray(args));
            return this;
        },
        addSelect (args) {
            state.select = _.uniq([
                ...state.select,
                ..._.castArray(args)
            ]);
            return this;
        },
        insert (data) {
            state.type = 'insert';
            state.data = data;
            return this;
        },
        onConflict (args) {
            state.onConflict = args;
            return this;
        },
        merge (args) {
            state.merge = args;
            return this;
        },
        ignore () {
            state.ignore = true;
            return this;
        },
        delete () {
            state.type = 'delete';
            return this;
        },
        ref (name) {
            return db.connection.ref(transform.toColumnName(meta, name));
        },
        update (data) {
            state.type = 'update';
            state.data = data;
            return this;
        },
        increment (column, amount = 1) {
            state.type = 'update';
            state.increments.push({
                column,
                amount
            });
            return this;
        },
        decrement (column, amount = 1) {
            state.type = 'update';
            state.decrements.push({
                column,
                amount
            });
            return this;
        },
        count (count = 'id') {
            state.type = 'count';
            state.count = count;
            return this;
        },
        max (column) {
            state.type = 'max';
            state.max = column;
            return this;
        },
        where (where = {}) {
            if (!_.isPlainObject(where)) {
                throw new Error('Where must be an object');
            }
            state.where.push(where);
            return this;
        },
        limit (limit) {
            state.limit = limit;
            return this;
        },
        offset (offset) {
            state.offset = offset;
            return this;
        },
        orderBy (orderBy) {
            state.orderBy = orderBy;
            return this;
        },
        groupBy (groupBy) {
            state.groupBy = groupBy;
            return this;
        },
        populate (populate) {
            state.populate = populate;
            return this;
        },
        search (query) {
            state.search = query;
            return this;
        },
        transacting (transaction) {
            state.transaction = transaction;
            return this;
        },
        forUpdate () {
            state.forUpdate = true;
            return this;
        },
        init (params = {}) {
            const { _q, filters, where, select, limit, offset, orderBy, groupBy, populate } = params;
            if (!_.isNil(where)) {
                this.where(where);
            }
            if (!_.isNil(_q)) {
                this.search(_q);
            }
            if (!_.isNil(select)) {
                this.select(select);
            } else {
                this.select('*');
            }
            if (!_.isNil(limit)) {
                this.limit(limit);
            }
            if (!_.isNil(offset)) {
                this.offset(offset);
            }
            if (!_.isNil(orderBy)) {
                this.orderBy(orderBy);
            }
            if (!_.isNil(groupBy)) {
                this.groupBy(groupBy);
            }
            if (!_.isNil(populate)) {
                this.populate(populate);
            }
            if (!_.isNil(filters)) {
                this.filters(filters);
            }
            return this;
        },
        filters (filters) {
            state.filters = filters;
        },
        first () {
            state.first = true;
            return this;
        },
        join (join$1) {
            if (!join$1.targetField) {
                state.joins.push(join$1);
                return this;
            }
            const model = db.metadata.get(uid);
            const attribute = model.attributes[join$1.targetField];
            join.createJoin({
                db,
                qb: this,
                uid
            }, {
                alias: this.alias,
                refAlias: join$1.alias,
                attributeName: join$1.targetField,
                attribute
            });
            return this;
        },
        mustUseAlias () {
            return [
                'select',
                'count'
            ].includes(state.type);
        },
        aliasColumn (key, alias) {
            if (typeof key !== 'string') {
                return key;
            }
            if (key.indexOf('.') >= 0) {
                return key;
            }
            if (!_.isNil(alias)) {
                return `${alias}.${key}`;
            }
            return this.mustUseAlias() ? `${this.alias}.${key}` : key;
        },
        raw: db.connection.raw.bind(db.connection),
        shouldUseSubQuery () {
            return [
                'delete',
                'update'
            ].includes(state.type) && state.joins.length > 0;
        },
        runSubQuery () {
            const originalType = state.type;
            this.select('id');
            const subQB = this.getKnexQuery();
            const nestedSubQuery = db.getConnection().select('id').from(subQB.as('subQuery'));
            const connection = db.getConnection(tableName);
            return connection[originalType]().whereIn('id', nestedSubQuery);
        },
        processState () {
            if (this.state.processed) {
                return;
            }
            state.orderBy = orderBy.processOrderBy(state.orderBy, {
                qb: this,
                uid,
                db
            });
            if (!_.isNil(state.filters)) {
                if (_.isFunction(state.filters)) {
                    const filters = state.filters({
                        qb: this,
                        uid,
                        meta,
                        db
                    });
                    if (!_.isNil(filters)) {
                        state.where.push(filters);
                    }
                } else {
                    state.where.push(state.filters);
                }
            }
            state.where = where.processWhere(state.where, {
                qb: this,
                uid,
                db
            });
            state.populate = process(state.populate, {
                qb: this,
                uid,
                db
            });
            state.data = transform.toRow(meta, state.data);
            this.processSelect();
            this.state.processed = true;
        },
        shouldUseDistinct () {
            return state.joins.length > 0 && _.isEmpty(state.groupBy);
        },
        shouldUseDeepSort () {
            return state.orderBy.filter(({ column })=>column.indexOf('.') >= 0).filter(({ column })=>{
                const col = column.split('.');
                for(let i = 0; i < col.length - 1; i += 1){
                    const el = col[i];
                    // order by "rel"."xxx"
                    const isRelationAttribute = meta.attributes[el]?.type === 'relation';
                    // order by "t2"."xxx"
                    const isAliasedRelation = Object.values(state.joins).map((join)=>join.alias).includes(el);
                    if (isRelationAttribute || isAliasedRelation) {
                        return true;
                    }
                }
                return false;
            }).length > 0;
        },
        processSelect () {
            state.select = state.select.map((field)=>{
                if (knex.isKnexQuery(field)) {
                    return field;
                }
                return transform.toColumnName(meta, field);
            });
            if (this.shouldUseDistinct()) {
                const joinsOrderByColumns = state.joins.flatMap((join)=>{
                    return _.keys(join.orderBy).map((key)=>this.aliasColumn(key, join.alias));
                });
                const orderByColumns = state.orderBy.map(({ column })=>column);
                state.select = _.uniq([
                    ...joinsOrderByColumns,
                    ...orderByColumns,
                    ...state.select
                ]);
            }
        },
        getKnexQuery () {
            if (!state.type) {
                this.select('*');
            }
            const aliasedTableName = this.mustUseAlias() ? `${tableName} as ${this.alias}` : tableName;
            const qb = db.getConnection(aliasedTableName);
            // The state should always be processed before calling shouldUseSubQuery as it
            // relies on the presence or absence of joins to determine the need of a subquery
            this.processState();
            if (this.shouldUseSubQuery()) {
                return this.runSubQuery();
            }
            switch(state.type){
                case 'select':
                    {
                        qb.select(state.select.map((column)=>this.aliasColumn(column)));
                        if (this.shouldUseDistinct()) {
                            qb.distinct();
                        }
                        break;
                    }
                case 'count':
                    {
                        const dbColumnName = this.aliasColumn(transform.toColumnName(meta, state.count));
                        if (this.shouldUseDistinct()) {
                            qb.countDistinct({
                                count: dbColumnName
                            });
                        } else {
                            qb.count({
                                count: dbColumnName
                            });
                        }
                        break;
                    }
                case 'max':
                    {
                        const dbColumnName = this.aliasColumn(transform.toColumnName(meta, state.max));
                        qb.max({
                            max: dbColumnName
                        });
                        break;
                    }
                case 'insert':
                    {
                        qb.insert(state.data);
                        if (db.dialect.useReturning() && _.has('id', meta.attributes)) {
                            qb.returning('id');
                        }
                        break;
                    }
                case 'update':
                    {
                        if (state.data) {
                            qb.update(state.data);
                        }
                        break;
                    }
                case 'delete':
                    {
                        qb.delete();
                        break;
                    }
                case 'truncate':
                    {
                        qb.truncate();
                        break;
                    }
                default:
                    {
                        throw new Error('Unknown query type');
                    }
            }
            if (state.transaction) {
                qb.transacting(state.transaction);
            }
            if (state.forUpdate) {
                qb.forUpdate();
            }
            if (!_.isEmpty(state.increments)) {
                state.increments.forEach((incr)=>qb.increment(incr.column, incr.amount));
            }
            if (!_.isEmpty(state.decrements)) {
                state.decrements.forEach((decr)=>qb.decrement(decr.column, decr.amount));
            }
            if (state.onConflict) {
                if (state.merge) {
                    qb.onConflict(state.onConflict).merge(state.merge);
                } else if (state.ignore) {
                    qb.onConflict(state.onConflict).ignore();
                }
            }
            if (state.limit) {
                qb.limit(state.limit);
            }
            if (state.offset) {
                qb.offset(state.offset);
            }
            if (state.orderBy.length > 0) {
                qb.orderBy(state.orderBy);
            }
            if (state.first) {
                qb.first();
            }
            if (state.groupBy.length > 0) {
                qb.groupBy(state.groupBy);
            }
            // if there are joins and it is a delete or update use a sub query
            if (state.where) {
                where.applyWhere(qb, state.where);
            }
            // if there are joins and it is a delete or update use a sub query
            if (state.search) {
                qb.where((subQb)=>{
                    search.applySearch(subQb, state.search, {
                        qb: this,
                        db,
                        uid
                    });
                });
            }
            if (state.joins.length > 0) {
                join.applyJoins(qb, state.joins);
            }
            if (this.shouldUseDeepSort()) {
                return orderBy.wrapWithDeepSort(qb, {
                    qb: this,
                    db,
                    uid
                });
            }
            return qb;
        },
        async execute ({ mapResults = true } = {}) {
            try {
                const qb = this.getKnexQuery();
                const transaction = transactionContext.transactionCtx.get();
                if (transaction) {
                    qb.transacting(transaction);
                }
                const rows = await qb;
                if (state.populate && !_.isNil(rows)) {
                    await apply(_.castArray(rows), state.populate, {
                        qb: this,
                        uid,
                        db
                    });
                }
                let results = rows;
                if (mapResults && state.type === 'select') {
                    results = transform.fromRow(meta, rows);
                }
                return results;
            } catch (error) {
                if (error instanceof Error) {
                    db.dialect.transformErrors(error);
                } else {
                    throw error;
                }
            }
        },
        stream ({ mapResults = true } = {}) {
            if (state.type === 'select') {
                return new readable({
                    qb: this,
                    db,
                    uid,
                    mapResults
                });
            }
            throw new database(`query-builder.stream() has been called with an unsupported query type: "${state.type}"`);
        }
    };
};

module.exports = createQueryBuilder;
//# sourceMappingURL=query-builder.js.map
