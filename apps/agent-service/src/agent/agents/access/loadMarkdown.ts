import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

const markdownDirectories = [
  path.resolve(process.cwd(), 'apps/agent-service/src/agent/agents/access'),
  path.resolve(process.cwd(), 'dist/apps/agent-service/assets/access-service-agent'),
  path.resolve(process.cwd(), 'assets/access-service-agent'),
];

export function loadAccessAgentMarkdown(filename: string): string {
  if (path.basename(filename) !== filename || !filename.endsWith('.md')) {
    throw new Error(`Invalid Access Service agent Markdown filename: ${filename}`);
  }

  for (const directory of markdownDirectories) {
    const markdownPath = path.join(directory, filename);
    if (existsSync(markdownPath)) {
      return readFileSync(markdownPath, 'utf8').trim();
    }
  }

  throw new Error(`Unable to load Access Service agent Markdown file '${filename}'.`);
}
