'use strict';

var stream = require('stream');
var fs = require('fs');
var path = require('path');
var fse = require('fs-extra');
var utils = require('@strapi/utils');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var utils__namespace = /*#__PURE__*/_interopNamespaceDefault(utils);

const { PayloadTooLargeError } = utils__namespace.errors;
const { kbytesToBytes, bytesToHumanReadable } = utils__namespace.file;
const UPLOADS_FOLDER_NAME = 'uploads';
var index = {
    init ({ sizeLimit: providerOptionsSizeLimit } = {}) {
        // TODO V5: remove providerOptions sizeLimit
        if (providerOptionsSizeLimit) {
            process.emitWarning('[deprecated] In future versions, "sizeLimit" argument will be ignored from upload.config.providerOptions. Move it to upload.config');
        }
        // Ensure uploads folder exists
        const uploadPath = path.resolve(strapi.dirs.static.public, UPLOADS_FOLDER_NAME);
        if (!fse.pathExistsSync(uploadPath)) {
            throw new Error(`The upload folder (${uploadPath}) doesn't exist or is not accessible. Please make sure it exists.`);
        }
        return {
            checkFileSize (file, options) {
                const { sizeLimit } = options ?? {};
                // TODO V5: remove providerOptions sizeLimit
                if (providerOptionsSizeLimit) {
                    if (kbytesToBytes(file.size) > providerOptionsSizeLimit) throw new PayloadTooLargeError(`${file.name} exceeds size limit of ${bytesToHumanReadable(providerOptionsSizeLimit)}.`);
                } else if (sizeLimit) {
                    if (kbytesToBytes(file.size) > sizeLimit) throw new PayloadTooLargeError(`${file.name} exceeds size limit of ${bytesToHumanReadable(sizeLimit)}.`);
                }
            },
            uploadStream (file) {
                if (!file.stream) {
                    return Promise.reject(new Error('Missing file stream'));
                }
                const { stream: stream$1 } = file;
                return new Promise((resolve, reject)=>{
                    stream.pipeline(stream$1, fs.createWriteStream(path.join(uploadPath, `${file.hash}${file.ext}`)), (err)=>{
                        if (err) {
                            return reject(err);
                        }
                        file.url = `/${UPLOADS_FOLDER_NAME}/${file.hash}${file.ext}`;
                        resolve();
                    });
                });
            },
            upload (file) {
                if (!file.buffer) {
                    return Promise.reject(new Error('Missing file buffer'));
                }
                const { buffer } = file;
                return new Promise((resolve, reject)=>{
                    // write file in public/assets folder
                    fs.writeFile(path.join(uploadPath, `${file.hash}${file.ext}`), buffer, (err)=>{
                        if (err) {
                            return reject(err);
                        }
                        file.url = `/${UPLOADS_FOLDER_NAME}/${file.hash}${file.ext}`;
                        resolve();
                    });
                });
            },
            delete (file) {
                return new Promise((resolve, reject)=>{
                    const filePath = path.join(uploadPath, `${file.hash}${file.ext}`);
                    if (!fs.existsSync(filePath)) {
                        resolve("File doesn't exist");
                        return;
                    }
                    // remove file from public/assets folder
                    fs.unlink(filePath, (err)=>{
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                });
            }
        };
    }
};

module.exports = index;
//# sourceMappingURL=index.js.map
