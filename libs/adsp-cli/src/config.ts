import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { EnvironmentName } from './environments';

export interface CliConfig {
  tenantRealm: string;
  env?: EnvironmentName;
}

export function getConfigFilePath(): string {
  return path.join(os.homedir(), '.adsp-cli', 'config.json');
}

export function readConfig(): CliConfig | null {
  try {
    return JSON.parse(fs.readFileSync(getConfigFilePath(), 'utf-8')) as CliConfig;
  } catch {
    return null;
  }
}

export function writeConfig(config: CliConfig): void {
  const filePath = getConfigFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), { mode: 0o600, encoding: 'utf-8' });
}
