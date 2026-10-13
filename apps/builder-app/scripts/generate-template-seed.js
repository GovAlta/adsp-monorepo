const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.resolve(__dirname, '../templates/react');
const OUTPUT_DIR = path.resolve(__dirname, '../.generated/template-seed');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'react.json');
const SCAFFOLD_OUTPUT_FILE = path.join(OUTPUT_DIR, 'react-scaffold.json');

// Project files that make the workspace runnable standalone. They are not seeded into the workspace
// (the agent does not need them and could break the preview by editing them); the builder adds them
// to the downloaded archive instead. An explicit allowlist keeps dist/, node_modules and
// package-lock.json (which would not match agent-modified dependencies) out of the download, as well
// as README.md (monorepo-relative links) and the legacy .eslintrc.json (superseded by the flat config).
const SCAFFOLD_FILES = [
  'index.html',
  'webpack.config.js',
  'webpack.common.js',
  'tsconfig.json',
  'eslint.config.mjs',
  '.prettierrc.json',
  '.gitignore',
];

// True binary formats — skipped from the seed because large data URLs (e.g. a
// 1MB PNG) exceed CSS custom property limits in preview. SVG is text and is
// NOT listed here; it travels as plain text and the scaffold converts it to an
// inline data URL on demand.
const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.avif',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
]);

function isBinary(filePath) {
  return BINARY_EXTS.has(path.extname(filePath).toLowerCase());
}

function collectFiles(dir, baseDir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      collectFiles(fullPath, baseDir, files);
    } else if (entry.isFile()) {
      // Skip binary formats (PNG, JPEG, fonts, etc.) — large data URLs exceed
      // CSS custom property limits in preview. SVG is included as plain text.
      if (isBinary(entry.name)) {
        continue;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      files.push({ path: relativePath, content });
    }
  }
  return files;
}

const files = [];

// src/ — all editable template source files
collectFiles(path.join(TEMPLATE_DIR, 'src'), TEMPLATE_DIR, files);

// AGENTS.md — agent instructions for the workspace
const agentsMdPath = path.join(TEMPLATE_DIR, 'AGENTS.md');
if (fs.existsSync(agentsMdPath)) {
  files.push({ path: 'AGENTS.md', content: fs.readFileSync(agentsMdPath, 'utf8') });
}

// package.json — dependency reference for the agent
const packageJsonPath = path.join(TEMPLATE_DIR, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  files.push({ path: 'package.json', content: fs.readFileSync(packageJsonPath, 'utf8') });
}

const scaffoldFiles = SCAFFOLD_FILES.map((name) => ({
  path: name,
  content: fs.readFileSync(path.join(TEMPLATE_DIR, name), 'utf8'),
}));

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(files));
fs.writeFileSync(SCAFFOLD_OUTPUT_FILE, JSON.stringify(scaffoldFiles));

console.log(`[builder-app] Generated template seed: ${files.length} files → ${OUTPUT_FILE}`);
console.log(`[builder-app] Generated template scaffold: ${scaffoldFiles.length} files → ${SCAFFOLD_OUTPUT_FILE}`);
