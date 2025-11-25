'use strict';

var fse = require('fs-extra');
var tar = require('tar');
var path = require('path');
var minimatch = require('minimatch');

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

var fse__namespace = /*#__PURE__*/_interopNamespaceDefault(fse);
var tar__namespace = /*#__PURE__*/_interopNamespaceDefault(tar);
var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);

const IGNORED_PATTERNS = [
    '**/.git/**',
    '**/node_modules/**',
    '**/build/**',
    '**/data/uploads/**',
    '**/dist/**',
    '**/.cache/**',
    '**/.circleci/**',
    '**/.github/**',
    '**/.gitignore',
    '**/.gitkeep',
    '**/.gitlab-ci.yml',
    '**/.idea/**',
    '**/public/uploads/**',
    '**/.vscode/**'
];
const isIgnoredFile = (folderPath, file, ignorePatterns)=>{
    ignorePatterns.push(...IGNORED_PATTERNS);
    const relativeFilePath = path__namespace.join(folderPath, file);
    let isIgnored = false;
    for (const pattern of ignorePatterns){
        if (pattern.startsWith('!')) {
            if (minimatch.minimatch(relativeFilePath, pattern.slice(1), {
                matchBase: true,
                dot: true
            })) {
                return false;
            }
        } else if (minimatch.minimatch(relativeFilePath, pattern, {
            matchBase: true,
            dot: true
        })) {
            if (path__namespace.basename(file) !== '.gitkeep') {
                isIgnored = true;
            }
        }
    }
    return isIgnored;
};
const getFiles = async (dirPath, ignorePatterns = [], subfolder = '')=>{
    const arrayOfFiles = [];
    const entries = await fse__namespace.readdir(path__namespace.join(dirPath, subfolder));
    for (const entry of entries){
        const entryPathFromRoot = path__namespace.join(subfolder, entry);
        const entryPath = path__namespace.relative(dirPath, entryPathFromRoot);
        const isIgnored = isIgnoredFile(dirPath, entryPathFromRoot, ignorePatterns);
        if (!isIgnored) {
            if (fse__namespace.statSync(entryPath).isDirectory()) {
                const subFiles = await getFiles(dirPath, ignorePatterns, entryPathFromRoot);
                arrayOfFiles.push(...subFiles);
            } else {
                arrayOfFiles.push(entryPath);
            }
        }
    }
    return arrayOfFiles;
};
const readGitignore = async (folderPath)=>{
    const gitignorePath = path__namespace.resolve(folderPath, '.gitignore');
    const pathExist = await fse__namespace.pathExists(gitignorePath);
    if (!pathExist) return [];
    const gitignoreContent = await fse__namespace.readFile(gitignorePath, 'utf8');
    return gitignoreContent.split(/\r?\n/).filter((line)=>Boolean(line.trim()) && !line.startsWith('#'));
};
const compressFilesToTar = async (storagePath, folderToCompress, filename)=>{
    const ignorePatterns = await readGitignore(folderToCompress);
    const filesToCompress = await getFiles(folderToCompress, ignorePatterns);
    return tar__namespace.c({
        gzip: true,
        file: path__namespace.resolve(storagePath, filename)
    }, filesToCompress);
};

exports.compressFilesToTar = compressFilesToTar;
exports.isIgnoredFile = isIgnoredFile;
//# sourceMappingURL=compress-files.js.map
