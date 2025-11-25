import { toLower } from 'lodash/fp';
import { Strategy } from 'passport-local';
import { getService } from '../../utils/index.mjs';

const createLocalStrategy = (strapi, middleware)=>{
    return new Strategy({
        usernameField: 'email',
        passwordField: 'password',
        session: false
    }, (email, password, done)=>{
        return getService('auth').checkCredentials({
            email: toLower(email),
            password
        }).then(async ([error, user, message])=>{
            if (middleware) {
                return middleware([
                    error,
                    user,
                    message
                ], done);
            }
            return done(error, user, message);
        }).catch((error)=>done(error));
    });
};

export { createLocalStrategy as default };
//# sourceMappingURL=local-strategy.mjs.map
