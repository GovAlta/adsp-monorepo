import axios from 'axios';
import fse__default from 'fs-extra';
import os from 'os';
import { apiConfig } from '../config/api.mjs';
import { getLocalConfig } from '../config/local.mjs';
import packageJson from '../package.json.mjs';
import { getContext } from './context.mjs';

const VERSION = 'v3';
async function cloudApiFactory({ logger }, token) {
    const localConfig = await getLocalConfig();
    const customHeaders = {
        'x-device-id': localConfig.installId,
        'x-app-version': packageJson.version,
        'x-os-name': os.type(),
        'x-os-version': os.version(),
        'x-language': Intl.DateTimeFormat().resolvedOptions().locale,
        'x-node-version': process.versions.node
    };
    const axiosCloudAPI = axios.create({
        baseURL: `${apiConfig.apiBaseUrl}/${VERSION}`,
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
                file: fse__default.createReadStream(filePath),
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
            const ctx = getContext();
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

export { VERSION, cloudApiFactory };
//# sourceMappingURL=cli-api.mjs.map
