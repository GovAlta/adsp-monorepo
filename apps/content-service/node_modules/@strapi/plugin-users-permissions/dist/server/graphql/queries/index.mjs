import { __require as requireMe } from './me.mjs';

var queries;
var hasRequiredQueries;
function requireQueries() {
    if (hasRequiredQueries) return queries;
    hasRequiredQueries = 1;
    const me = requireMe();
    queries = ({ nexus })=>{
        return nexus.extendType({
            type: 'Query',
            definition (t) {
                t.field('me', me({
                    nexus
                }));
            }
        });
    };
    return queries;
}

export { requireQueries as __require };
//# sourceMappingURL=index.mjs.map
