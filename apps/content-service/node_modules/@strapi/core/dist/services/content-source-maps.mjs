import { vercelStegaCombine } from '@vercel/stega';
import { traverseEntity } from '@strapi/utils';

const ENCODABLE_TYPES = [
    'string',
    'text',
    'richtext',
    'biginteger',
    'date',
    'time',
    'datetime',
    'timestamp',
    'boolean',
    'enumeration',
    'json',
    'media',
    'email',
    'password'
];
// TODO: use a centralized store for these fields that would be shared with the CM and CTB
const EXCLUDED_FIELDS = [
    'id',
    'documentId',
    'locale',
    'localizations',
    'created_by',
    'updated_by',
    'created_at',
    'updated_at',
    'publishedAt'
];
const isObject = (value)=>{
    return typeof value === 'object' && value !== null;
};
const createContentSourceMapsService = (strapi)=>{
    return {
        encodeField (text, { kind, model, documentId, type, path, locale }) {
            /**
       * Combine all metadata into into a one string so we only have to deal with one data-atribute
       * on the frontend. Make it human readable because that data-attribute may be set manually by
       * users for fields that don't support sourcemap encoding.
       */ const strapiSource = new URLSearchParams();
            strapiSource.set('documentId', documentId);
            strapiSource.set('type', type);
            strapiSource.set('path', path);
            if (model) {
                strapiSource.set('model', model);
            }
            if (kind) {
                strapiSource.set('kind', kind);
            }
            if (locale) {
                strapiSource.set('locale', locale);
            }
            return vercelStegaCombine(text, {
                strapiSource: strapiSource.toString()
            });
        },
        async encodeEntry ({ data, schema }) {
            if (!isObject(data) || data === undefined) {
                return data;
            }
            return traverseEntity(({ key, value, attribute, schema, path }, { set })=>{
                if (!attribute || EXCLUDED_FIELDS.includes(key)) {
                    return;
                }
                if (ENCODABLE_TYPES.includes(attribute.type) && typeof value === 'string') {
                    set(key, this.encodeField(value, {
                        path: path.rawWithIndices,
                        type: attribute.type,
                        kind: schema.kind,
                        model: schema.uid,
                        locale: data.locale,
                        documentId: data.documentId
                    }));
                }
            }, {
                schema,
                getModel: (uid)=>strapi.getModel(uid)
            }, data);
        },
        async encodeSourceMaps ({ data, schema }) {
            try {
                if (Array.isArray(data)) {
                    return await Promise.all(data.map((item)=>this.encodeSourceMaps({
                            data: item,
                            schema
                        })));
                }
                if (!isObject(data)) {
                    return data;
                }
                return await this.encodeEntry({
                    data,
                    schema
                });
            } catch (error) {
                strapi.log.error('Error encoding source maps:', error);
                return data;
            }
        }
    };
};

export { createContentSourceMapsService };
//# sourceMappingURL=content-source-maps.mjs.map
