// This script in-place replaces secret data with base64 encoded value.
import { lstatSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { scalarOptions, parse, stringify } from 'yaml';
import { processManifest } from './processManifest';

scalarOptions.null.nullStr = '';

const arg = process.argv[2];
if (arg) {
  const files = [];

  const stats = lstatSync(arg);
  if (stats.isFile()) {
    files.push(arg);
  } else if (stats.isDirectory()) {
    const dirFiles = readdirSync(arg)
      .filter(f => !f.includes('encoded'))
      .map(f => path.join(arg, f));
    files.push(...dirFiles);
  }

  files.forEach((file) => {
    console.log(`Processing: '${file}' ...`);

    const content = readFileSync(file, 'utf8');
    const manifest = parse(content);
    const processed = processManifest(manifest);

    if (processed) {
      const extension = path.extname(file);
      const basename = path.basename(file, extension);
      const processedFile = path.join(path.dirname(file), `${basename}.encoded${extension}`);

      writeFileSync(processedFile, stringify(processed, {}));
      console.log(`Encoded file written to: ${processedFile}`);
    }
  });
}
