'use strict';

var fp = require('lodash/fp');
var Koa = require('koa');
var createError = require('http-errors');
var delegate = require('delegates');
var statuses = require('statuses');
var errors = require('../errors.js');

const addCustomMethods = (app)=>{
    const delegator = delegate(app.context, 'response');
    /* errors */ statuses.codes.filter((code)=>code >= 400 && code < 600).forEach((code)=>{
        const name = statuses(code);
        const camelCasedName = fp.camelCase(name);
        app.response[camelCasedName] = function responseCode(message = name, details = {}) {
            const httpError = createError(code, message, {
                details
            });
            const { status, body } = errors.formatHttpError(httpError);
            this.status = status;
            this.body = body;
        };
        delegator.method(camelCasedName);
    });
    /* send, created, deleted */ app.response.send = function send(data, status = 200) {
        this.status = status;
        this.body = data;
    };
    app.response.created = function created(data) {
        this.status = 201;
        this.body = data;
    };
    app.response.deleted = function deleted(data) {
        if (fp.isNil(data)) {
            this.status = 204;
        } else {
            this.status = 200;
            this.body = data;
        }
    };
    delegator.method('send').method('created').method('deleted');
    return app;
};
const createKoaApp = ({ proxy, keys })=>{
    const app = new Koa({
        proxy
    });
    app.keys = keys;
    addCustomMethods(app);
    return app;
};

module.exports = createKoaApp;
//# sourceMappingURL=koa.js.map
