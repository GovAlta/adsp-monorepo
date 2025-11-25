'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');

const getRelationTargetStatus = (relation, opts)=>{
    // Ignore if the target content type does not have draft and publish enabled
    const targetContentType = strapi.getModel(opts.targetUid);
    const sourceContentType = strapi.getModel(opts.sourceUid);
    const targetHasDP = strapiUtils.contentTypes.hasDraftAndPublish(targetContentType);
    const sourceHasDP = strapiUtils.contentTypes.hasDraftAndPublish(sourceContentType);
    if (!targetHasDP) {
        return [
            'published'
        ];
    }
    /**
   * If both source and target have DP enabled,
   * connect it to the same status as the source status
   */ if (sourceHasDP && !fp.isNil(opts.sourceStatus)) {
        return [
            opts.sourceStatus
        ];
    }
    /**
   * Use the status from the relation if it's set
   */ if (relation.status) {
        switch(relation.status){
            case 'published':
                return [
                    'published'
                ];
            default:
                // Default to draft if it's an invalid status (e.g. modified)
                return [
                    'draft'
                ];
        }
    }
    /**
   * If DP is disabled and relation does not specify any status
   * Connect to both draft and published versions
   */ if (!sourceHasDP) {
        return [
            'draft',
            'published'
        ];
    }
    // Default to draft as a fallback
    return [
        'draft'
    ];
};

exports.getRelationTargetStatus = getRelationTargetStatus;
//# sourceMappingURL=dp.js.map
