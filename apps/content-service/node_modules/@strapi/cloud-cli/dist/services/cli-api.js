'use strict';

var axios = require('axios');
var fse = require('fs-extra');
var os = require('os');
var api = require('../config/api.js');
var local = require('../config/local.js');
var _package = require('../package.json.js');
var context = require('./context.js');

const VERSION = 'v3';
async function cloudApiFactory({ logger }, token) {
    const localConfig = await local.getLocalConfig();
    const customHeaders = {
        'x-device-id': localConfig.installId,
        'x-app-version': _package.default.version,
        'x-os-name': os.type(),
        'x-os-version': os.version(),
        'x-language': Intl.DateTimeFormat().resolvedOptions().locale,
        'x-node-version': process.versions.node
    };
    const axiosCloudAPI = axios.create({
        baseURL: `${api.apiConfig.apiBaseUrl}/${VERSION}`,
        headers: {
            'Content-Type': 'application/json',
            ...customHeaders
        }
    });
    if (token) {
        axiosCloudAPI.defaults.headers.Authorization = `Bearer ${token}`;
    }
    return {
        deploy ({ filePath, project }, { onUploadProgress }) {
            return axiosCloudAPI.post(`/deploy/${project.name}`, {
                file: fse.createReadStream(filePath),
                targetEnvironment: project.targetEnvironment
            }, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress
            });
        },
        async createProject ({ name, nodeVersion, region, plan }) {
            const response = await axiosCloudAPI.post('/project', {
                projectName: name,
                region,
                nodeVersion,
                plan
            });
            return {
                data: {
                    id: response.data.id,
                    name: response.data.name,
                    environmentInternalName: response.data.environmentInternalName
                },
                status: response.status
            };
        },
        getUserInfo () {
            return axiosCloudAPI.get('/user');
        },
        async config () {
            try {
                const response = await axiosCloudAPI.get('/config');
                if (response.status !== 200) {
                    throw new Error('Error fetching cloud CLI config from the server.');
                }
                return response;
            } catch (error) {
                logger.debug("🥲 Oops! Couldn't retrieve the cloud CLI config from the server. Please try again.");
                throw error;
            }
        },
        async listProjects () {
            try {
                const response = await axiosCloudAPI.get('/projects');
                if (response.status !== 200) {
                    throw new Error('Error fetching cloud projects from the server.');
                }
                return response;
            } catch (error) {
                logger.debug("🥲 Oops! Couldn't retrieve your project's list from the server. Please try again.");
                throw error;
            }
        },
        async listLinkProjects () {
            try {
                const response = await axiosCloudAPI.get('/projects-linkable');
                if (response.status !== 200) {
                    throw new Error('Error fetching cloud projects from the server.');
                }
                return response;
            } catch (error) {
                logger.debug("🥲 Oops! Couldn't retrieve your project's list from the server. Please try again.");
                throw error;
            }
        },
        async listEnvironments ({ name }) {
            try {
                const response = await axiosCloudAPI.get(`/projects/${name}/environments`);
                if (response.status !== 200) {
                    throw new Error('Error fetching cloud environments from the server.');
                }
                return response;
            } catch (error) {
                logger.debug("🥲 Oops! Couldn't retrieve your project's environments from the server. Please try again.");
                throw error;
            }
        },
        async listLinkEnvironments ({ name }) {
            try {
                const response = await axiosCloudAPI.get(`/projects/${name}/environments-linkable`);
                if (response.status !== 200) {
                    throw new Error('Error fetching cloud environments from the server.');
                }
                return response;
            } catch (error) {
                logger.debug("🥲 Oops! Couldn't retrieve your project's environments from the server. Please try again.");
                throw error;
            }
        },
        async getProject ({ name }) {
            try {
                const response = await axiosCloudAPI.get(`/projects/${name}`);
                if (response.status !== 200) {
                    throw new Error("Error fetching project's details.");
                }
                return response;
            } catch (error) {
                logger.debug("🥲 Oops! There was a problem retrieving your project's details. Please try again.");
                throw error;
            }
        },
        async createTrial ({ strapiVersion }) {
            try {
                const response = await axiosCloudAPI.post(`/cms-trial-request`, {
                    strapiVersion
                });
                if (response.status !== 200) {
                    throw new Error('Error creating trial.');
                }
                return response;
            } catch (error) {
                logger.debug('🥲 Oops! There was a problem creating your trial. Please try again.');
                throw error;
            }
        },
        track (event, payload = {}) {
            const ctx = context.getContext();
            if (ctx?.user?.id) {
                axiosCloudAPI.defaults.headers['x-user-id'] = ctx.user.id;
            }
            return axiosCloudAPI.post('/track', {
                event,
                payload
            });
        }
    };
}

exports.VERSION = VERSION;
exports.cloudApiFactory = cloudApiFactory;
//# sourceMappingURL=cli-api.js.map
