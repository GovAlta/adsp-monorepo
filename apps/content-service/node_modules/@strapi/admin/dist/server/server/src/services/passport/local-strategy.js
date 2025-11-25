'use strict';

var fp = require('lodash/fp');
var passportLocal = require('passport-local');
var index = require('../../utils/index.js');

const createLocalStrategy = (strapi, middleware)=>{
    return new passportLocal.Strategy({
        usernameField: 'email',
        passwordField: 'password',
        session: false
    }, (email, password, done)=>{
        return index.getService('auth').checkCredentials({
            email: fp.toLower(email),
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

module.exports = createLocalStrategy;
//# sourceMappingURL=local-strategy.js.map
