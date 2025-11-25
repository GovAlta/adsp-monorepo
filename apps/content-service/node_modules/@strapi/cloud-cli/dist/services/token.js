'use strict';

var jwksClient = require('jwks-rsa');
var jwt = require('jsonwebtoken');
var local = require('../config/local.js');
var cliApi = require('./cli-api.js');

let cliConfig;
async function tokenServiceFactory({ logger }) {
    const cloudApiService = await cliApi.cloudApiFactory({
        logger
    });
    async function saveToken(str) {
        const appConfig = await local.getLocalConfig();
        if (!appConfig) {
            logger.error('There was a problem saving your token. Please try again.');
            return;
        }
        appConfig.token = str;
        try {
            await local.saveLocalConfig(appConfig);
        } catch (e) {
            logger.debug(e);
            logger.error('There was a problem saving your token. Please try again.');
        }
    }
    async function retrieveToken() {
        const appConfig = await local.getLocalConfig();
        if (appConfig.token) {
            // check if token is still valid
            if (await isTokenValid(appConfig.token)) {
                return appConfig.token;
            }
        }
        return undefined;
    }
    async function validateToken(idToken, jwksUrl) {
        const client = jwksClient({
            jwksUri: jwksUrl
        });
        // Get the Key from the JWKS using the token header's Key ID (kid)
        const getKey = (header, callback)=>{
            client.getSigningKey(header.kid, (e, key)=>{
                if (e) {
                    callback(e);
                } else if (key) {
                    const publicKey = 'publicKey' in key ? key.publicKey : key.rsaPublicKey;
                    callback(null, publicKey);
                } else {
                    callback(new Error('Key not found'));
                }
            });
        };
        const decodedToken = jwt.decode(idToken, {
            complete: true
        });
        if (!decodedToken) {
            if (typeof idToken === 'undefined' || idToken === '') {
                logger.warn('You need to be logged in to use this feature. Please log in and try again.');
            } else {
                logger.error('There seems to be a problem with your login information. Please try logging in again.');
            }
            return Promise.reject(new Error('Invalid token'));
        }
        // Verify the JWT token signature using the JWKS Key
        return new Promise((resolve, reject)=>{
            jwt.verify(idToken, getKey, (err)=>{
                if (err) {
                    reject(err);
                }
                if (decodedToken.payload.exp < Math.floor(Date.now() / 1000)) {
                    reject(new Error('Token is expired'));
                }
                resolve();
            });
        });
    }
    async function isTokenValid(token) {
        try {
            const config = await cloudApiService.config();
            cliConfig = config.data;
            if (token) {
                await validateToken(token, cliConfig.jwksUrl);
                return true;
            }
            return false;
        } catch (e) {
            logger.debug(e);
            return false;
        }
    }
    async function eraseToken() {
        const appConfig = await local.getLocalConfig();
        if (!appConfig) {
            return;
        }
        delete appConfig.token;
        try {
            await local.saveLocalConfig(appConfig);
        } catch (e) {
            logger.debug(e);
            logger.error('There was an issue removing your login information. Please try logging out again.');
            throw e;
        }
    }
    async function getValidToken(ctx, loginAction) {
        let token = await retrieveToken();
        while(!token || !await isTokenValid(token)){
            logger.log(token ? 'Oops! Your token seems expired or invalid. Please login again.' : "We couldn't find a valid token. You need to be logged in to use this feature.");
            if (!await loginAction(ctx)) return null;
            token = await retrieveToken();
        }
        return token;
    }
    return {
        saveToken,
        retrieveToken,
        validateToken,
        isTokenValid,
        eraseToken,
        getValidToken
    };
}

exports.tokenServiceFactory = tokenServiceFactory;
//# sourceMappingURL=token.js.map
