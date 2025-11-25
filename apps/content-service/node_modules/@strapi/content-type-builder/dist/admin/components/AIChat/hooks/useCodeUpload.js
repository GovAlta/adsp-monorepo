'use strict';

var React = require('react');
var JSZip = require('jszip');
var micromatch = require('micromatch');
var misc = require('../lib/misc.js');
var ChatProvider = require('../providers/ChatProvider.js');
var useAIFetch = require('./useAIFetch.js');

const ALLOWED_EXTENSIONS = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.md',
    '.json'
];
const MAX_LINES_PER_FILE = 5000; // Maximum number of lines per file
// Common patterns to ignore
const DEFAULT_IGNORE_PATTERNS = [
    '**/node_modules/**',
    '**/.git/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    '**/.cache/**',
    '**/coverage/**',
    '**/test/**',
    '**/__tests__/**',
    '**/*.test.*',
    '**/*.spec.*'
];
const isAllowedFile = (filename, ignorePatterns = [])=>{
    // Check if file matches any ignore pattern
    if (micromatch.isMatch(filename, [
        ...DEFAULT_IGNORE_PATTERNS,
        ...ignorePatterns
    ])) {
        return false;
    }
    // Check if file has allowed extension
    return ALLOWED_EXTENSIONS.some((ext)=>filename.toLowerCase().endsWith(ext));
};
/**
 * Prunes file content if it exceeds MAX_LINES
 */ const pruneFileContent = (content)=>{
    const lines = content.split('\n');
    if (lines.length <= MAX_LINES_PER_FILE) {
        return content;
    }
    const truncated = lines.slice(0, MAX_LINES_PER_FILE).join('\n');
    return `${truncated}\n\n// ... [${lines.length - MAX_LINES_PER_FILE} lines truncated, file too long] ...\n\n`;
};
/* -------------------------------------------------------------------------------------------------
 * Zip file processing
 * -----------------------------------------------------------------------------------------------*/ async function openZipFile(file, options = {}) {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const processedFiles = [];
    // Process all files in parallel
    await Promise.all(Object.keys(contents.files).map(async (filename)=>{
        const zipEntry = contents.files[filename];
        // Skip directories and non-allowed files
        if (zipEntry.dir || !isAllowedFile(filename, options.ignorePatterns)) {
            return;
        }
        try {
            const content = await zipEntry.async('string');
            processedFiles.push({
                path: filename,
                content: pruneFileContent(content)
            });
        } catch (err) {
            console.warn(`Failed to read file ${filename}:`, err);
        }
    }));
    // Sort files by path for consistency
    return processedFiles.sort((a, b)=>a.path.localeCompare(b.path));
}
/* -------------------------------------------------------------------------------------------------
 * Folder processing
 * -----------------------------------------------------------------------------------------------*/ async function processFolder(files, options = {}) {
    const processedFiles = [];
    let folderName = 'Project';
    // Extract folder name from the first file's path
    if (files.length > 0) {
        const firstFile = files[0];
        const folderPath = firstFile.webkitRelativePath || '';
        const pathParts = folderPath.split('/');
        if (pathParts.length > 0 && pathParts[0]) {
            folderName = pathParts[0];
        }
    }
    // Process all files in parallel
    await Promise.all(Array.from(files).map(async (file)=>{
        const filePath = file.webkitRelativePath || file.name;
        // Skip non-allowed files
        if (!isAllowedFile(filePath, options.ignorePatterns)) {
            return;
        }
        try {
            const content = await file.text();
            processedFiles.push({
                // Remove the root folder name from the path
                path: filePath.includes('/') ? filePath.substring(filePath.indexOf('/') + 1) : filePath,
                content: pruneFileContent(content)
            });
        } catch (err) {
            console.warn(`Failed to read file ${filePath}:`, err);
        }
    }));
    // Sort files by path for consistency
    return {
        files: processedFiles.sort((a, b)=>a.path.localeCompare(b.path)),
        projectName: folderName
    };
}
/* -------------------------------------------------------------------------------------------------
 * Zip file processing
 * -----------------------------------------------------------------------------------------------*/ async function processZipFile(file, options = {}) {
    const projectName = file.name.replace('.zip', '');
    const files = await openZipFile(file, options);
    return {
        files,
        projectName
    };
}
function useCodeUpload({ onSuccess, onError } = {}) {
    const [error, setError] = React.useState(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const { fetch: fetchUploadProject, isPending: isFetching, error: fetchError } = useAIFetch.useFetchUploadProject();
    const { id: chatId } = ChatProvider.useStrapiChat();
    /**
   * Upload processed files to the server
   */ const processFiles = async (projectName, processedFiles)=>{
        // Upload to server
        const result = await fetchUploadProject({
            body: {
                chatId,
                name: projectName,
                type: 'code',
                files: processedFiles
            }
        });
        if (!result?.data) {
            throw new Error('Failed to upload project');
        }
        return result.data;
    };
    const handleZipFile = async (file)=>{
        try {
            setError(null);
            setIsProcessing(true);
            const { files: processedFiles, projectName } = await processZipFile(file, {
                ignorePatterns: [
                    '**/node_modules/**'
                ]
            });
            const projectAttachment = await processFiles(projectName, processedFiles);
            onSuccess?.({
                ...projectAttachment,
                id: misc.generateId(),
                status: 'ready'
            }, projectName);
            return projectAttachment;
        } catch (err) {
            setError('Failed to process zip file');
            onError?.('Failed to process zip file');
            console.error('Error processing zip:', err);
            throw err;
        } finally{
            setIsProcessing(false);
        }
    };
    const handleFolder = async (files)=>{
        try {
            setError(null);
            setIsProcessing(true);
            const { files: processedFiles, projectName } = await processFolder(files, {
                ignorePatterns: [
                    '**/node_modules/**'
                ]
            });
            const projectAttachment = await processFiles(projectName, processedFiles);
            onSuccess?.({
                ...projectAttachment,
                id: misc.generateId(),
                status: 'ready'
            }, projectName);
            return projectAttachment;
        } catch (err) {
            setError('Failed to process folder');
            onError?.('Failed to process folder');
            console.error('Error processing folder:', err);
            throw err;
        } finally{
            setIsProcessing(false);
        }
    };
    return {
        processZipFile: handleZipFile,
        processFolder: handleFolder,
        isLoading: isProcessing || isFetching,
        error: fetchError || error
    };
}

exports.openZipFile = openZipFile;
exports.processFolder = processFolder;
exports.processZipFile = processZipFile;
exports.useCodeUpload = useCodeUpload;
//# sourceMappingURL=useCodeUpload.js.map
