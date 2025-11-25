import type { Schema, UID, Utils } from '../..';
export type IsDraftAndPublishEnabled<TSchemaUID extends UID.Schema> = Utils.MatchFirst<[
    [
        UID.IsContentType<TSchemaUID>,
        Utils.IsTrue<NonNullable<Schema.Schema<TSchemaUID>['options']>['draftAndPublish']>
    ],
    [
        Utils.And<Utils.Not<Utils.Extends<TSchemaUID, UID.ContentType>>, UID.IsComponent<TSchemaUID>>,
        Utils.Constants.False
    ]
], Utils.Constants.True>;
//# sourceMappingURL=draft-and-publish.d.ts.map