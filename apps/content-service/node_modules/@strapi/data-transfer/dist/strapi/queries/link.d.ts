import type { Knex } from 'knex';
import type { Core } from '@strapi/types';
import { ILink } from '../../../types';
export declare const createLinkQuery: (strapi: Core.Strapi, trx?: Knex.Transaction) => () => {
    generateAll: (uid: string) => AsyncGenerator<ILink>;
    generateAllForAttribute: (uid: string, fieldName: string) => AsyncGenerator<ILink>;
    insert: (link: ILink) => Promise<void>;
};
export declare const filterValidRelationalAttributes: (attributes: Record<string, any>) => Record<string, any>;
//# sourceMappingURL=link.d.ts.map