import _ from 'lodash';
import { getService } from '../utils/index.mjs';
import { validateComponentInput, validateUpdateComponentInput } from './validation/component.mjs';

/**
 * Components controller
 */ var components = {
    /**
   * GET /components handler
   * Returns a list of available components
   * @param {Object} ctx - koa context
   */ async getComponents (ctx) {
        const componentService = getService('components');
        const componentUIDs = Object.keys(strapi.components);
        const data = componentUIDs.map((uid)=>{
            return componentService.formatComponent(strapi.components[uid]);
        });
        ctx.send({
            data
        });
    },
    /**
   * GET /components/:uid
   * Returns a specific component
   * @param {Object} ctx - koa context
   */ async getComponent (ctx) {
        const { uid } = ctx.params;
        const component = strapi.components[uid];
        if (!component) {
            return ctx.send({
                error: 'component.notFound'
            }, 404);
        }
        const componentService = getService('components');
        ctx.send({
            data: componentService.formatComponent(component)
        });
    },
    /**
   * POST /components
   * Creates a component and returns its infos
   * @param {Object} ctx - koa context
   */ async createComponent (ctx) {
        const body = ctx.request.body;
        try {
            await validateComponentInput(body);
        } catch (error) {
            return ctx.send({
                error
            }, 400);
        }
        try {
            strapi.reload.isWatching = false;
            const componentService = getService('components');
            const component = await componentService.createComponent({
                component: body.component,
                components: body.components
            });
            setImmediate(()=>strapi.reload());
            ctx.send({
                data: {
                    uid: component.uid
                }
            }, 201);
        } catch (error) {
            strapi.log.error(error);
            ctx.send({
                error: error?.message || 'Unknown error'
            }, 400);
        }
    },
    /**
   * PUT /components/:uid
   * Updates a component and return its infos
   * @param {Object} ctx - koa context - enhanced koa context
   */ async updateComponent (ctx) {
        const { uid } = ctx.params;
        const body = ctx.request.body;
        if (!_.has(strapi.components, uid)) {
            return ctx.send({
                error: 'component.notFound'
            }, 404);
        }
        try {
            await validateUpdateComponentInput(body);
        } catch (error) {
            return ctx.send({
                error
            }, 400);
        }
        try {
            strapi.reload.isWatching = false;
            const componentService = getService('components');
            const component = await componentService.editComponent(uid, {
                component: body.component,
                components: body.components
            });
            setImmediate(()=>strapi.reload());
            ctx.send({
                data: {
                    uid: component.uid
                }
            });
        } catch (error) {
            strapi.log.error(error);
            ctx.send({
                error: error?.message || 'Unknown error'
            }, 400);
        }
    },
    /**
   * DELETE /components/:uid
   * Deletes a components and returns its old infos
   * @param {Object} ctx - koa context
   */ async deleteComponent (ctx) {
        const { uid } = ctx.params;
        if (!_.has(strapi.components, uid)) {
            return ctx.send({
                error: 'component.notFound'
            }, 404);
        }
        try {
            strapi.reload.isWatching = false;
            const componentService = getService('components');
            const component = await componentService.deleteComponent(uid);
            setImmediate(()=>strapi.reload());
            ctx.send({
                data: {
                    uid: component.uid
                }
            });
        } catch (error) {
            strapi.log.error(error);
            ctx.send({
                error: error?.message || 'Unknown error'
            }, 400);
        }
    }
};

export { components as default };
//# sourceMappingURL=components.mjs.map
