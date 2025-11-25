import require$$0 from 'lodash';
import require$$1 from 'jsonwebtoken';

var jwt_1;
var hasRequiredJwt;
function requireJwt() {
    if (hasRequiredJwt) return jwt_1;
    hasRequiredJwt = 1;
    /**
	 * Jwt.js service
	 *
	 * @description: A set of functions similar to controller's actions to avoid code duplication.
	 */ const _ = require$$0;
    const jwt = require$$1;
    jwt_1 = ({ strapi })=>({
            getToken (ctx) {
                let token;
                if (ctx.request && ctx.request.header && ctx.request.header.authorization) {
                    const parts = ctx.request.header.authorization.split(/\s+/);
                    if (parts[0].toLowerCase() !== 'bearer' || parts.length !== 2) {
                        return null;
                    }
                    token = parts[1];
                } else {
                    return null;
                }
                return this.verify(token);
            },
            issue (payload, jwtOptions = {}) {
                _.defaults(jwtOptions, strapi.config.get('plugin::users-permissions.jwt'));
                return jwt.sign(_.clone(payload.toJSON ? payload.toJSON() : payload), strapi.config.get('plugin::users-permissions.jwtSecret'), jwtOptions);
            },
            verify (token) {
                return new Promise((resolve, reject)=>{
                    jwt.verify(token, strapi.config.get('plugin::users-permissions.jwtSecret'), {}, (err, tokenPayload = {})=>{
                        if (err) {
                            return reject(new Error('Invalid token.'));
                        }
                        resolve(tokenPayload);
                    });
                });
            }
        });
    return jwt_1;
}

export { requireJwt as __require };
//# sourceMappingURL=jwt.mjs.map
