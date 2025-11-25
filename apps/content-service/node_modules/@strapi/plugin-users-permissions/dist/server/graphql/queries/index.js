'use strict';

var me = require('./me.js');

var queries;
var hasRequiredQueries;
function requireQueries() {
    if (hasRequiredQueries) return queries;
    hasRequiredQueries = 1;
    const me$1 = me.__require();
    queries = ({ nexus })=>{
        return nexus.extendType({
            type: 'Query',
            definition (t) {
                t.field('me', me$1({
                    nexus
                }));
            }
        });
    };
    return queries;
}

exports.__require = requireQueries;
//# sourceMappingURL=index.js.map
