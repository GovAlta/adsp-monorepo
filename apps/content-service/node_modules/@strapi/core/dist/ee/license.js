'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var strapiUtils = require('@strapi/utils');

const DEFAULT_FEATURES = {
    bronze: [],
    silver: [],
    gold: [
        {
            name: 'sso'
        },
        // Set a null retention duration to allow the user to override it
        // The default of 90 days is set in the audit logs service
        {
            name: 'audit-logs',
            options: {
                retentionDays: null
            }
        },
        {
            name: 'review-workflows'
        },
        {
            name: 'cms-content-releases'
        },
        {
            name: 'cms-content-history',
            options: {
                retentionDays: 99999
            }
        },
        {
            name: 'cms-advanced-preview'
        }
    ]
};
const LICENSE_REGISTRY_URI = 'https://license.strapi.io';
const publicKey = fs.readFileSync(path.resolve(__dirname, '../../resources/key.pub'));
class LicenseCheckError extends Error {
    constructor(message, shouldFallback = false){
        super(message);
        this.shouldFallback = false;
        this.shouldFallback = shouldFallback;
    }
}
const readLicense = (directory)=>{
    try {
        const path$1 = path.join(directory, 'license.txt');
        return fs.readFileSync(path$1).toString();
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code !== 'ENOENT') {
            throw Error('License file not readable, review its format and access rules.');
        }
    }
};
const verifyLicense = (license)=>{
    const [signature, base64Content] = Buffer.from(license, 'base64').toString().split('\n');
    if (!signature || !base64Content) {
        throw new Error('Invalid license.');
    }
    const stringifiedContent = Buffer.from(base64Content, 'base64').toString();
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(stringifiedContent);
    verify.end();
    const verified = verify.verify(publicKey, signature, 'base64');
    if (!verified) {
        throw new Error('Invalid license.');
    }
    const licenseInfo = JSON.parse(stringifiedContent);
    if (!licenseInfo.features) {
        licenseInfo.features = DEFAULT_FEATURES[licenseInfo.type];
    }
    if (!licenseInfo.isTrial) {
        licenseInfo.isTrial = false;
    }
    Object.freeze(licenseInfo.features);
    return licenseInfo;
};
const throwError = ()=>{
    throw new LicenseCheckError('Could not proceed to the online validation of your license.', true);
};
const fetchLicense = async ({ strapi }, key, projectId)=>{
    const { installId: installIdFromPackageJson } = strapi.config;
    const response = await strapi.fetch(`${LICENSE_REGISTRY_URI}/api/licenses/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            key,
            projectId,
            deviceId: strapiUtils.generateInstallId(projectId, installIdFromPackageJson)
        })
    }).catch(throwError);
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
        const { data, error } = await response.json();
        switch(response.status){
            case 200:
                return data.license;
            case 400:
                throw new LicenseCheckError(error.message);
            case 404:
                throw new LicenseCheckError('The license used does not exists.');
            default:
                throwError();
        }
    } else {
        throwError();
    }
};

exports.LICENSE_REGISTRY_URI = LICENSE_REGISTRY_URI;
exports.LicenseCheckError = LicenseCheckError;
exports.fetchLicense = fetchLicense;
exports.readLicense = readLicense;
exports.verifyLicense = verifyLicense;
//# sourceMappingURL=license.js.map
