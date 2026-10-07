import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

const markdownDirectories = [
  path.resolve(process.cwd(), 'apps/agent-service/src/agent/agents/access'),
  path.resolve(process.cwd(), 'dist/apps/agent-service/assets/access-service-agent'),
  path.resolve(process.cwd(), 'assets/access-service-agent'),
];

export function loadAccessAgentMarkdown(filename: string): string {
  const normalized = path.posix.normalize(filename.replace(/\\/g, '/'));
  const isValidPath =
    normalized.endsWith('.md') && !normalized.startsWith('../') && normalized !== '..' && !path.isAbsolute(normalized);

  if (!isValidPath) {
    throw new Error(`Invalid Access Service agent Markdown filename: ${filename}`);
  }

  for (const directory of markdownDirectories) {
    const markdownPath = path.join(directory, normalized);
    if (existsSync(markdownPath)) {
      return readFileSync(markdownPath, 'utf8').trim();
    }
  }

  throw new Error(`Unable to load Access Service agent Markdown file '${filename}'.`);
}
